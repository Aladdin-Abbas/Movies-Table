import { MRT_Row } from "material-react-table";
import { useEffect, useState } from "react";
import { Movie, MovieApiResponse } from "../types";
import omdbMoviesApi from "../apis/omdbMoviesApi";

import type { PaginationState } from "@tanstack/react-table";

const useMoviesTable = () => {
  //data and fetching state
  const [data, setData] = useState<Movie[]>([]);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRowToDelete, setSelectedRowToDelete] =
    useState<MRT_Row<Movie>>();
  const [validationErrors, setValidationErrors] = useState<{
    [cellId: string]: string;
  }>({});

  //table state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  //if you want to avoid useEffect, look at the React Query example instead
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      if (!data.length) {
        setIsLoading(true);
      } else {
        setIsRefetching(true);
      }

      try {
        const response = await omdbMoviesApi.get("/?apikey=bc6d047&s=man", {
          params: { page: pagination.pageIndex + 1 },
          signal: controller.signal,
        });
        const json = (await response.data) as MovieApiResponse;

        setData(json.Search);
        setRowCount(json.totalResults);
      } catch (error) {
        setIsError(true);
        console.error(error);
        return;
      }
      setIsError(false);
      setIsLoading(false);
      setIsRefetching(false);
    };

    fetchData();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize]);

  return {
    data,
    setData,
    isError,
    setIsError,
    isLoading,
    setIsLoading,
    isRefetching,
    setIsRefetching,
    rowCount,
    setRowCount,
    createModalOpen,
    setCreateModalOpen,
    deleteModalOpen,
    setDeleteModalOpen,
    selectedRowToDelete,
    setSelectedRowToDelete,
    validationErrors,
    setValidationErrors,
    pagination,
    setPagination,
  };
};

export default useMoviesTable;
