// @ts-check
'use strict';

/// CACHE ///

/** @type {Directory | null} */
let directoryDataCache = null;

/** @type {Promise<FetchResult<Directory>> | null} */
let directoryDataPromise = null;

/** @type {Map<string, Collection>} */
let collectionDataCache = new Map();

/** @type {Map<string, Promise<FetchResult<Collection>>>} */
let collectionDataPromises = new Map();

/// DATA ///

/**
 * @returns {Promise<FetchResult<Directory>>}
 */
async function fetchDirectoryData() {
  if (directoryDataCache) {
    return Promise.resolve({ data: directoryDataCache, error: null });
  }

  if (directoryDataPromise) {
    return directoryDataPromise;
  }

  /** @type Promise<FetchResult<Directory>> */
  const fetchResultPromise = fetchJsonData('directory.json');
  directoryDataPromise = fetchResultPromise;

  const fetchResult = await fetchResultPromise;
  directoryDataPromise = null;

  if (fetchResult.data && !fetchResult.error) {
    directoryDataCache = fetchResult.data;
  }

  return fetchResult;
}

/**
 * @param {string} collectionId 
 * @returns {Promise<FetchResult<Collection>>}
 */
async function fetchCollectionData(collectionId) {
  const collectionData = collectionDataCache.get(collectionId);
  if (collectionData) {
    return Promise.resolve({ data: collectionData, error: null });
  }

  const collectionPromise = collectionDataPromises.get(collectionId);
  if (collectionPromise) {
    return collectionPromise;
  }

  /** @type Promise<FetchResult<Collection>> */
  const fetchResultPromise = fetchJsonData(`collections/${collectionId}.json`);
  collectionDataPromises.set(collectionId, fetchResultPromise);

  const fetchResult = await fetchResultPromise;
  collectionDataPromises.delete(collectionId);
  
  if (fetchResult.data && !fetchResult.error) {
    collectionDataCache.set(collectionId, fetchResult.data);
  }

  return fetchResult;
}

/**
 * @template T
 * @param {string} requestUri 
 * @returns {Promise<FetchResult<T>>}
 */
async function fetchJsonData(requestUri) {
  /** @type {Response | null} */
  let response = null;

  /** @type {FetchResult<T>} */
  let result = { data: null, error: null };
  try {
    response = await fetch(`/data/${requestUri}`);
  } catch (error) {
    result.error = `Fetch for "${requestUri}" failed: "${error}"`;
    return result;
  }

  if (!response.ok) {
    result.error = `Fetch for "${requestUri}" returned ${response.status}:${response.statusText}`;
    return result;
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    result.error = `Fetch for "${requestUri}" returned "${contentType}"`;
    return result;
  }
  /** @type {T | null} */
  let json = null;
  try {
    json = await response.json();
  } catch (error) {
    result.error = `JSON parsing for "${requestUri}" failed: "${error}"`;
  }
  result.data = json;
  return result;
}

/**
 * @param {...string | undefined | null} errors 
 * @returns {string}
 */
function aggregateErrors(...errors) {
  return errors.filter(error => !!error).join('; ');
}

/// LAYOUT ///

Vue.component('page-container', {
  /** @type {Array<keyof PageContainerProps>} */
  props: ['loading', 'error'],
  template: `
    <div v-cloak class="pageContainer">
      <page-header />
        <div v-if="!!error" key="error" class="pageContent pageError">
          {{ error }}
        </div>
        <div v-else-if="!!loading" key="loading" class="pageContent pageLoading">
          LOADING...
        </div>
        <main v-show="!loading" key="content" class="pageContent">
          <slot name="content" />
        </main>
      <page-footer />
    </div>
  `
});

Vue.component('page-header', {
  template: `
    <header class="pageHeader">
      <nav class="pageHeaderNav">
        <router-link exact :to="{ name: 'collections' }">Collections</router-link>
        <router-link exact :to="{ name: 'about' }">About</router-link>
      </nav>
      <router-link exact :to="{ name: 'home' }" class="pageHeaderBrand linkWrapper">
        Film by Eric
      </router-link>
    </header>
  `
});

Vue.component('page-title', {
  /** @type {Array<keyof PageTitleProps>} */
  props: ['title'],
  template: `
    <div class="pageTitle" role="heading" aria-level="1">
      {{ title }}
    </div>
  `
});

Vue.component('page-title-multiline', {
  /** @type {Array<keyof PageTitleMultilineProps>} */
  props: ['title', 'subtitle'],
  template: `
    <div class="pageTitle">
      <div role="heading" aria-level="1">
        {{ title }}
      </div>
      <div role="heading" aria-level="2">
        {{ subtitle }}
      </div>
    </div>
  `
});

Vue.component('page-footer', {
  computed: {
    currentYear() {
      return new Date().getFullYear();
    }
  },
  template: `
    <footer class="pageFooter">
      <div>&copy; {{ currentYear }} Eric Mercer</div>
    </footer>
  `
});

/// COMPONENTS ///

Vue.component('photo-item', {
  /** @type {Array<keyof PhotoItemProps>} */
  props: ['src', 'alt', 'type'],
  /** @returns {PhotoItemData} */
  data() {
    return {
      isLoaded: false,
    };
  },
  methods: {
    /** @this {PhotoItemData & VueComponent} */
    handleLoad() {
      this.isLoaded = true;
      this.$emit('photoLoaded');
    },
    /** @this {PhotoItemData & VueComponent} */
    handleError() {
      this.$emit('photoError');
    }
  },
  template: `
    <div
      :class="{
        photoItem: true,
        photoItemCover: type === 'cover'
      }"
    >
      <img
        :src="src"
        :alt="alt"
        :class="{
          photoItemImageLoading: !isLoaded,
          photoItemImageOutline: isLoaded && ['portrait', 'landscape'].includes(type),
          photoItemImageCover: type === 'cover',
          photoItemImagePortrait: type === 'portrait',
          photoItemImageLandscape: type === 'landscape',
        }"
        @load="handleLoad"
        @error="handleError"
      />
    </div>
  `
});

Vue.component('photo-collection', {
  /** @type {Array<keyof PhotoCollectionProps>} */
  props: ['photos'],
  /** @returns {PhotoCollectionData} */
  data() {
    return {
      numPhotosLoaded: 0,
    };
  },
  methods: {
    /** @this {PhotoCollectionProps & PhotoCollectionData & VueComponent} */
    handlePhotoLoaded() {
      this.numPhotosLoaded += 1;
      if (this.numPhotosLoaded === this.photos.length) {
        this.$emit('collectionLoaded');
      }
    },
    /** @this {PhotoCollectionProps & PhotoCollectionData & VueComponent} */
    handlePhotoError() {
      this.$emit('collectionError');
    }
  },
  template: `
    <div class="photoCollection">
      <photo-item
        v-for="p in photos"
        v-once
        :key="p.src"
        :src="p.src"
        :alt="p.alt"
        :type="p.type"
        @photoLoaded="handlePhotoLoaded"
        @photoError="handlePhotoError"
      />
    </div>
  `
});

Vue.component('directory-list-item', {
  /** @type {Array<keyof DirectoryListItemProps>} */
  props: ['collection'],
  template: `
    <router-link
      :to="{ name: 'collection', params: { id: collection.id } }"
      exact
      class="directoryListItem linkWrapper"
    >
      <div class="directoryListItemPhoto">
        <photo-item
          :src="collection.cover.src"
          alt=""
          type="cover"
        />
      </div>
      <div class="directoryListItemCaption">
        {{ collection.title }}
      </div>
    </router-link>
  `
});

Vue.component('directory-list', {
  /** @type {Array<keyof DirectoryListProps>} */
  props: ['collections'],
  template: `
    <div class="directoryList">
      <directory-list-item
        v-for="c in collections"
        v-once
        :key="c.id"
        :collection="c"
      />
    </div>
  `
});

/// PAGES ///

const AboutPage = {
  /** @returns {PageData} */
  data() {
    return {
      loading: true,
      error: null,
    };
  },
  methods: {
    /** @this {PageData & VueComponent} */
    handleLoad() {
      this.loading = false;
    },
    /** @this {PageData & VueComponent} */
    handleError() {
      this.error = 'Photo failed to load.'
    }
  },
  template: `
    <page-container :loading="loading" :error="error">
      <div slot="content">
        <page-title title="About" />
        <div class="aboutContainer">
          <div class="aboutPhoto">
            <img
              src="/images/about/scan48439.jpg"
              alt="Eric Mercer looking to the side at Joshua Tree National Park while holding a Fuji Natura Classica film camera"
              class="aboutPhotoImage"
              @load="handleLoad"
              @error="handleError"
            />
            <div class="aboutPhotoCredit">
              Photo by <a href="https://erikaoutsider.com/" target="_blank">Erika Johnson</a>
            </div>
          </div>
          <div class="aboutBio">
            Hi, I'm Eric. I'm a Seattle-based photographer trying my hand at shooting film.
            <br><br>
            With film, I find it easier to balance taking photos with being fully present in the moment.
            A film roll only holds space for a few photos, inspiring equal bouts of spontaneity and careful deliberation.
            Line up a shot, release the shutter, and move on. There is no pause to review; the film won't be developed until days or weeks later.
            Maybe the scene was captured, maybe it was lost. Either way, the moment is still here to be experienced.
            <br><br>
            In my free time, I enjoy brewing espresso, traveling, and hiking with my partner Erika.
            <br><br>
            All photos are unedited from the original film scans.
          </div>
        </div>
      </main>
    </page-container>
  `
};

const DirectoryPage = {
  /** @returns {DirectoryPageData} */
  data() {
    return {
      loading: false,
      error: null,
      directory: null,
    };
  },
  /** @this {DirectoryPageMethods} */
  created() {
    this.fetchData();
  },
  watch: {
    $route: 'fetchData'
  },
  /** @type DirectoryPageMethods */
  methods: {
    /** @this {DirectoryPageData} */
    async fetchData() {
      this.loading = true;

      const { data, error } = await fetchDirectoryData();
      this.directory = data;

      this.error = error;
      this.loading = false;
    }
  },
  template: `
    <page-container :loading="loading" :error="error">
      <div slot="content" v-if="!!directory?.collections.length > 0">
        <page-title title="Collections" />
        <directory-list :collections="directory?.collections" />
      </main>
    </page-container>
  `
};

const CollectionPage = {
  data() {
    /** @returns {CollectionPageData} */
    return {
      loading: false,
      error: null,
      directory: null,
      collection: null,
    };
  },
  /** @this {CollectionPageMethods} */
  created() {
    this.fetchData();
  },
  watch: {
    $route: 'fetchData'
  },
  /** @type CollectionPageMethods */
  methods: {
    /** @this {ParameterizedCollectionPageData} */
    async fetchData() {
      this.loading = true;

      const directoryPromise = fetchDirectoryData();
      const collectionPromise = fetchCollectionData(this.$route.params.id);

      const [directoryResult, collectionResult] = await Promise.all([directoryPromise, collectionPromise]);

      const { data: directoryData, error: directoryError } = directoryResult;
      const { data: collectionData, error: collectionError } = collectionResult;

      this.directory = directoryData;
      this.collection = collectionData;

      this.error = aggregateErrors(directoryError, collectionError);

      if (this.error) {
        this.loading = false;
      }

      if (this.collection) {
        document.title = `${this.collection.title} - ${DEFAULT_TITLE}`;
      }
    },
    /** @this {CollectionPageData} */
    handleCollectionLoaded() {
      this.loading = false;
    },
    /** @this {CollectionPageData} */
    handleCollectionError() {
      this.error = aggregateErrors(this.error, 'One or more photos failed to load.');
    }
  },
  computed: {
      /** @this {ParameterizedCollectionPageData} */
    pageTitle() {
      return `${this.collection?.date || 'Unknown'} // ${this.collection?.title || 'Unknown'}`;
    },
    /** @this {ParameterizedCollectionPageData} */
    pageSubtitle() {
      return `${this.collection?.camera || 'Unknown'}, ${this.collection?.film || 'Unknown'}`;
    }
  },
  template: `
    <page-container :loading="loading" :error="error">
      <div slot="content" v-if="!!collection">
        <page-title-multiline
          :title="pageTitle"
          :subtitle="pageSubtitle"
        />
        <photo-collection
          :photos="this.collection.photos"
          @collectionLoaded="handleCollectionLoaded"
          @collectionError="handleCollectionError"
        />
      </main>
    </page-container>
  `
};

/// APP ///

const routes = [
  { path: '/', name: 'home', redirect: '/collections' },
  { path: '/about', name: 'about', component: AboutPage, meta: { title: 'About' } },
  { path: '/collections', name: 'collections', component: DirectoryPage, meta: { title: 'Collections' } },
  { path: '/collections/:id', name: 'collection', component: CollectionPage, meta: { title: 'Collection' } },
  { path: '*', redirect: '/' }
];

const activeLinkClass = 'linkActive';
const ariaCurrentAttribute = 'aria-current';

const router = new VueRouter({
    mode: 'history',
    linkActiveClass: activeLinkClass,
    routes: routes,
    scrollBehavior: () => ({ x: 0, y: 0 }),
});

const DEFAULT_TITLE = document.title;
router.afterEach(to => {
    Vue.nextTick(() => {
        document.title = to.meta.title ? `${to.meta.title} - ${DEFAULT_TITLE}` : DEFAULT_TITLE;
        
        const oldCurrentLink = document.querySelectorAll(`[${ariaCurrentAttribute}]`);
        const newCurrentLink = document.querySelectorAll(`.${activeLinkClass}`);
        oldCurrentLink?.forEach(link => link.removeAttribute(ariaCurrentAttribute));
        newCurrentLink?.forEach(link => link.setAttribute(ariaCurrentAttribute, 'page'));
    });
});

const app = new Vue({ router }).$mount('#app');