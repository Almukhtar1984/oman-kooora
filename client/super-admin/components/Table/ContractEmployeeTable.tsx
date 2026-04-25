import React, { useEffect } from "react";
import Table from "./Table";
import Th from "./Th";
import { useState } from "react";
import Td from "./Td";
import { ActionIcon, Box, Button, Flex, MantineTheme, Menu, Text, TextInput } from "@mantine/core";
import { keys } from "@mantine/utils";
import Avvvatars from "avvvatars-react";
import { IconAlignJustified, IconDots, IconEdit, IconTrash } from "@tabler/icons";
import { useTheme } from "@emotion/react";
import dayjs from "dayjs";
import useStore from "../../store/useStore";
import Image from "next/image";

type Props = {
  data?: any;
  searchValue?: string;
  onEditModal: (callback?: () => any) => void;
};

export interface RowData {
  id: string;
  contractName: string;
  wage: string;
  contractPrerequisite: string;
  contractStartDate: string;
  contractEndDate: string;
}

interface TableSortProps {
  data: RowData[];
}

function filterData(data: RowData[], search: string) {
  // const searchTableValue = useStore((state:any) => state.searchTableValue)
  const query = search?.toLowerCase()?.trim();
  return data.filter((item) =>
    keys(data[0]).some((key) => item?.[key]?.toLowerCase()?.includes(query))
  );
}

function sortData(
  data: RowData[],
  payload: { sortBy: keyof RowData | null; reversed: boolean; search: string }
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      if (payload.reversed) {
        return b[sortBy].localeCompare(a[sortBy]);
      }

      return a[sortBy].localeCompare(b[sortBy]);
    }),
    payload.search
  );
}

const ContractEmployeeTable = ({ data, searchValue, onEditModal, ...props }: Props) => {
  const [openRowOptionMenu, setopenRowOptionMenu] = useState<boolean>(false);
  const tableBreadcrumbs = useStore((state: any) => state.tableBreadcrumbs);

  const theme = useTheme() as MantineTheme;
  const [search, setSearch] = useState("");
  const [sortedData, setSortedData] = useState<typeof data>(data);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  useEffect(() => {
    setSortedData(data);
  }, [data]);

  const setSorting = (field: keyof RowData) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(data, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (/* event: React.ChangeEvent<HTMLInputElement> */ value) => {
    // const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortData(data, { sortBy, reversed: reverseSortDirection, search: value }));
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const handleClick = (index) => (event) => {
    setAnchorEl(event.currentTarget);
    setCurrentIndex(index);
  };

  const rows = sortedData.map((row: RowData, index) => (
    <>
      <tr key={row.id}>
        <Td>{row.contractName}</Td>
        <Td>{row.wage}</Td>
        <Td>
          <Button variant="white" color={"orange.5"} px="0">
            <Flex align={"center"} gap={4}>
              <Text color={theme.colors.orange[5]} size="xs" fw={400}>
                عرض التفاصيل
              </Text>
              <IconAlignJustified size={14} color={theme.colors.orange[5]} />
            </Flex>
          </Button>
        </Td>
        <Td>{dayjs(row.contractStartDate, "DD/MM/YYYY HH:mm:ss").format("YYYY/MM/DD")}</Td>
        <Td>{dayjs(row.contractEndDate, "DD/MM/YYYY HH:mm:ss").format("YYYY/MM/DD")}</Td>

        <Td>
          <Flex gap={4}>
            <Menu
              withArrow
              shadow="md"
              // width={200}
              opened={Boolean(anchorEl) && currentIndex == index}
              // opened={openRowOptionMenu}
              onClose={() => setAnchorEl(null)}
              //   closeOnClickOutside
            >
              <Menu.Target>
                <ActionIcon
                  color={"slate"}
                  variant="light"
                  bg={"slate.1"}
                  size="md"
                  //   onClick={() => setopenRowOptionMenu(true)}
                  onClick={handleClick(index)}
                >
                  <IconDots size={13} color={theme.colors.slate[6]} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  icon={<IconEdit size={14} />}
                  color="gray.6"
                  onClick={() => {
                    onEditModal(() => row);
                  }}
                >
                  تعديل
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item color="red" icon={<IconTrash size={14} />}>
                  حذف
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Flex>
        </Td>
      </tr>
      <tr>
        <Box
          component="td"
          py={"5px !important"}
          sx={({ colors }) => ({
            border: "unset !important",
          })}
        ></Box>
        {/* <Td></Td> */}
      </tr>
    </>
  ));

  React.useEffect(() => {
    setSearch(searchValue);
    setSortedData(sortData(data, { sortBy, reversed: reverseSortDirection, search: searchValue }));
  }, [searchValue, data, sortBy, reverseSortDirection]);

  return (
    <Table
      tHead={
        <tr>
          <Th
            // colSpan={2}
            sorted={sortBy === "contractName"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("contractName")}
          >
            إسم العقد
          </Th>
          <Th
            sorted={sortBy === "wage"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("wage")}
          >
            الراتب الشهري
          </Th>
          <Th
            sorted={sortBy === "contractPrerequisite"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("contractPrerequisite")}
          >
            شروط العقد
          </Th>
          <Th
            sorted={sortBy === "contractStartDate"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("contractStartDate")}
          >
            تاريخ بداية العقد
          </Th>
          <Th
            sorted={sortBy === "contractEndDate"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("contractEndDate")}
          >
            تاريخ نهاية العقد
          </Th>

          <Th
            // sorted={sortBy === "company"}
            // reversed={reverseSortDirection}
            // onSort={() => setSorting("company")}
            noSortIcon
          >
            المزيد
          </Th>
        </tr>
      }
    >
      <>
        {/* <TextInput
          placeholder="Search by any field"
          mb="md"
          // icon={<IconSearch size={14} stroke={1.5} />}
          value={search}
          onChange={handleSearchChange}
        /> */}

        {rows.length > 0 ? (
          rows
        ) : (
          <tr>
            <Td colSpan={6}>
              <Flex direction={"column"} align="center">
                <Image src="/empty2.svg" alt="" width={72} height={72} />
                <Text weight={500} align="center" color={"gray.4"}>
                  لايوجد محتوى
                </Text>
              </Flex>
            </Td>
          </tr>
        )}
      </>
    </Table>
  );
};

export default ContractEmployeeTable;
