/// LIBRARY TYPES ///

declare var Vue: any;
declare var VueRouter: any;

interface VueComponent {
  $emit: (event: string) => void;
}

/// PAGE DATA TYPES ///

interface FetchResult<T> {
  data: T | null;
  error: string | null;
}

interface PageData {
  loading?: boolean;
  error?: string | null;
}

interface DirectoryPageData extends Required<PageData> {
  directory: Directory | null;
}

interface DirectoryPageMethods {
  fetchData: () => void;
}

interface CollectionPageData extends DirectoryPageData {
  collection: Collection | null;
}

interface CollectionPageMethods {
  fetchData: () => void;
  handleCollectionLoaded: () => void;
  handleCollectionError: () => void;
}

interface ParameterizedCollectionPageData extends CollectionPageData {
  $route: {
    params: {
      id: string;
    }
  }
  collection: Collection | null;
}

/// COMPONENT DATA TYPES ///

type PageContainerProps = PageData;

interface PageTitleProps {
  title: string;
}

interface PageTitleMultilineProps extends PageTitleProps {
  subtitle: string;
}

interface PhotoCollectionProps {
  photos: Photo[];
}

interface PhotoCollectionData {
  numPhotosLoaded: number;
}

interface PhotoItemProps {
  src: string;
  alt: string;
  type: PhotoType
}

interface PhotoItemData {
  isLoaded: boolean;
}

interface DirectoryListItemProps {
  collection: Collection;
}

interface DirectoryListProps {
  collections: Collection[];
}

/// JSON DATA TYPES ///

interface Directory {
  collections: CollectionSummary[];
}

interface CollectionSummary {
  id: string;
  title: string;
  cover: Omit<Photo, 'type', 'alt'>;
}

interface Collection {
  id: string;
  title: string;
  date: string;
  camera: string;
  film: string;
  photos: Photo[];
}

interface Photo {
  src: string;
  alt: string;
  type: PhotoType;
}

type PhotoType = 'portrait' | 'landscape' | 'cover';