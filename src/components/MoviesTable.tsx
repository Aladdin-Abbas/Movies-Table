import { FC, useEffect, useMemo, useState, useCallback } from "react";
import MaterialReactTable, {
  MaterialReactTableProps,
  MRT_Cell,
  MRT_ColumnDef,
  MRT_Row,
} from "material-react-table";
import type {
  ColumnFiltersState,
  PaginationState,
  //   SortingState,
} from "@tanstack/react-table";
import { ExportToCsv } from "export-to-csv";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Delete, Edit } from "@mui/icons-material";
import { Movie, MovieApiResponse } from "../types";
import CreateNewMovieModal from "./CreateNewMovieModal";
import DeleteItemModal from "./DeleteItemModal";
import useMoviesTable from "../hooks/useMoviesTable";

const MoviesTable: FC = () => {
  //data and fetching state
  const {
    data,
    setData,
    isError,
    isLoading,
    isRefetching,
    rowCount,
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
  } = useMoviesTable();

  const handleCreateNewRow = (values: Movie) => {
    setData(prevState => [...prevState, values]);
  };

  const handleSaveRowEdits: MaterialReactTableProps<Movie>["onEditingRowSave"] =
    async ({ exitEditingMode, row, values }) => {
      if (!Object.keys(validationErrors).length) {
        data[row.index] = values;
        //send/receive api updates here, then refetch or update local table data for re-render
        setData([...data]);
        exitEditingMode(); //required to exit editing mode and close modal
      }
    };

  const handleCancelRowEdits = () => {
    setValidationErrors({});
  };

  const handleDeleteRowClick = (row: MRT_Row<Movie>) => {
    setSelectedRowToDelete(row);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedRowToDelete) {
      data.splice(selectedRowToDelete?.index, 1);
      setData([...data]);
    }
  };

  const validateRequired = (value: string) => !!value.length;

  const getCommonEditTextFieldProps = useCallback(
    (
      cell: MRT_Cell<Movie>
    ): MRT_ColumnDef<Movie>["muiTableBodyCellEditTextFieldProps"] => {
      return {
        error: !!validationErrors[cell.id],
        helperText: validationErrors[cell.id],
        onBlur: event => {
          const isValid = validateRequired(event.target.value);
          if (!isValid) {
            //set validation error for cell if invalid
            setValidationErrors({
              ...validationErrors,
              [cell.id]: `${cell.column.columnDef.header} is required`,
            });
          } else {
            //remove validation error for cell if valid
            delete validationErrors[cell.id];
            setValidationErrors({
              ...validationErrors,
            });
          }
        },
      };
    },
    [validationErrors]
  );

  const columns = useMemo<MRT_ColumnDef<Movie>[]>(
    () => [
      {
        accessorKey: "Title",
        header: "Title",
        enableClickToCopy: true,
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "Year",
        header: "Year",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "imdbID",
        header: "imdbID",
        enableColumnOrdering: false,
        enableEditing: false, //disable editing on this column
        enableSorting: false,
      },
      {
        accessorKey: "Type",
        header: "Type",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
      },
      {
        accessorKey: "Poster",
        header: "Poster",
        muiTableBodyCellEditTextFieldProps: ({ cell }) => ({
          ...getCommonEditTextFieldProps(cell),
        }),
        Cell: ({ cell, row }) => (
          <img
            alt="avatar"
            height={200}
            src={row.original.Poster}
            loading="lazy"
            style={{ borderRadius: "12px" }}
          />
        ),
      },

      //column definitions...
    ],
    []
  );

  const csvOptions = {
    fieldSeparator: ",",
    quoteStrings: '"',
    decimalSeparator: ".",
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: false,
    headers: columns.map(c => c.header),
  };

  const csvExporter = new ExportToCsv(csvOptions);

  const handleExportRows = (rows: MRT_Row<Movie>[]) => {
    csvExporter.generateCsv(rows.map(row => row.original));
  };

  const handleExportData = () => {
    csvExporter.generateCsv(data);
  };

  return (
    <>
      <MaterialReactTable
        displayColumnDefOptions={{
          "mrt-row-actions": {
            muiTableHeadCellProps: {
              align: "center",
            },
            size: 120,
          },
        }}
        columns={columns}
        data={data}
        enableRowSelection
        getRowId={row => row.imdbID}
        initialState={{ showColumnFilters: true }}
        enableColumnOrdering
        enableGlobalFilter
        manualPagination
        muiToolbarAlertBannerProps={
          isError
            ? {
                color: "error",
                children: "Error loading data",
              }
            : undefined
        }
        onPaginationChange={setPagination}
        muiTablePaginationProps={{
          rowsPerPageOptions: [],
          showFirstButton: false,
          showLastButton: false,
        }}
        rowCount={rowCount}
        state={{
          isLoading,
          pagination,
          showAlertBanner: isError,
          showProgressBars: isRefetching,
        }}
        editingMode="modal" //default
        enableEditing
        onEditingRowSave={handleSaveRowEdits}
        onEditingRowCancel={handleCancelRowEdits}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: "flex", gap: "1rem" }}>
            <Tooltip arrow placement="left" title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip arrow placement="right" title="Delete">
              <IconButton
                color="error"
                onClick={() => handleDeleteRowClick(row)}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        renderTopToolbarCustomActions={({ table }) => (
          <Box
            sx={{ display: "flex", gap: "1rem", p: "0.5rem", flexWrap: "wrap" }}
          >
            <Button
              color="secondary"
              onClick={() => setCreateModalOpen(true)}
              variant="contained"
            >
              Create New Movie
            </Button>
            <Button
              color="primary"
              //export all data that is currently in the table (ignore pagination, sorting, filtering, etc.)
              onClick={handleExportData}
              startIcon={<FileDownloadIcon />}
              variant="contained"
            >
              Export All Data
            </Button>
            <Button
              disabled={
                !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
              }
              //only export selected rows
              onClick={() => handleExportRows(table.getSelectedRowModel().rows)}
              startIcon={<FileDownloadIcon />}
              variant="contained"
            >
              Export Selected Rows
            </Button>
          </Box>
        )}
      />
      <CreateNewMovieModal
        columns={columns}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />
      <DeleteItemModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={handleConfirmDelete}
      />
    </>
  );
};

export default MoviesTable;
