import React from "react";
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
import { useMutation } from "@apollo/client";
// import { DeleteSalesDocument } from "../../generated/gql/graphql";

type Props = {
  data?: any;
  searchValue?: string;
  onEditModal: (callback?: () => any) => void;
};

export interface RowData {
  id: string;
  employeeName: string;
  employeeId: string;
  totalSales: string;
  salesFee: string;
  amountDue: string;
  updatedBy: string;
  createTime: string;
  __typename: string;
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

function sortData(data: RowData[], payload: { sortBy: keyof RowData | null; reversed: boolean; search: string }) {
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

const SaleTable = ({ data, searchValue, onEditModal, ...props }: Props) => {
  const [openRowOptionMenu, setopenRowOptionMenu] = useState<boolean>(false);

  const theme = useTheme() as MantineTheme;
  const [search, setSearch] = useState("");
  const [sortedData, setSortedData] = useState(data);
  const [sortBy, setSortBy] = useState<keyof RowData | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  // const [deleteMutation] = useMutation();

  React.useEffect(() => {
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
      <tr key={row.employeeName}>
        <Td>
          <Flex gap="8px" h="100%" align={"center"}>
            <Box
              sx={({ colors }) => ({
                border: "1px solid " + colors.gray[3],
                borderRadius: "50%",
              })}
            >
              <Avvvatars
                value={row.employeeName}
                style="shape"
                size={28}
                border={true}
                borderColor="#FFFFFF"
                borderSize={2}
              />
            </Box>
            <Flex direction={"column"} gap="0">
              <Text size={"xs"} color={"gray.6"}>
                {row.employeeName}
              </Text>
            </Flex>
          </Flex>
        </Td>
        <Td>{row.totalSales}</Td>
        <Td>{row.salesFee}</Td>
        <Td>{row.amountDue}</Td>
        <Td>
          <Flex gap="8px" h="100%" align={"center"}>
            <Box
              sx={({ colors }) => ({
                border: "1px solid " + colors.gray[3],
                borderRadius: "50%",
              })}
            >
              <Avvvatars
                value={row.updatedBy}
                style="shape"
                size={28}
                border={true}
                borderColor="#FFFFFF"
                borderSize={2}
              />
            </Box>
            <Flex direction={"column"} gap="0">
              <Text size={"xs"} color={"gray.6"}>
                {row.updatedBy}
              </Text>
            </Flex>
          </Flex>
        </Td>
        <Td>{dayjs(row.createTime, "DD/MM/YYYY HH:mm:ss").format("DD/MM/YYYY")}</Td>
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
                    onEditModal(() => data[index]);
                  }}
                >
                  تعديل
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                  color="red"
                  icon={<IconTrash size={14} />}
                  // onClick={() => {
                  //   deleteMutation({
                  //     variables: {
                  //       deleteSalesId: row.id,
                  //     },
                  //     update: (cache, { data: resp }) => {
                  //       cache.evict({ id: cache.identify(row as any) });
                  //       cache.gc();
                  //     },
                  //   });
                  // }}
                >
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
            sorted={sortBy === "employeeName"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("employeeName")}
          >
            الموظف
          </Th>
          <Th
            sorted={sortBy === "totalSales"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("totalSales")}
          >
            إجمالي المبيعات
          </Th>
          <Th
            sorted={sortBy === "salesFee"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("salesFee")}
          >
            النسبة من المبيعات
          </Th>
          <Th
            sorted={sortBy === "amountDue"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("amountDue")}
          >
            المبلغ المستحق
          </Th>
          <Th
            sorted={sortBy === "updatedBy"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("updatedBy")}
          >
            بواسطة
          </Th>
          <Th
            sorted={sortBy === "createTime"}
            reversed={reverseSortDirection}
            onSort={() => setSorting("createTime")}
          >
            تاريخ الإنشاء
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

        {rows.length > 0 ? (rows) : (
          <tr>
            <Td colSpan={7}>
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

export default SaleTable;
