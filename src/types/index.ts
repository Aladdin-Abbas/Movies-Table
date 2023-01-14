export type MovieApiResponse = {
  Search: Array<Movie>;
  totalResults: number;
  Response: boolean;
};

export type Movie = {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
};
