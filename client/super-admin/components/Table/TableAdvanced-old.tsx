import { useState, useEffect } from "react";
import {
  createStyles,
  Table,
  ScrollArea,
  UnstyledButton,
  Group,
  Text,
  Center,
  TextInput,
  Box,
  MantineTheme,
} from "@mantine/core";
import { keys } from "@mantine/utils";
import { IconSelector, IconChevronDown, IconChevronUp, IconSearch } from "@tabler/icons";
import { useTheme } from "@emotion/react";

const useStyles = createStyles((theme) => ({
  th: {
    "&:first-child": {
      borderTopLeftRadius: "6px",
      borderBottomLeftRadius: "6px",
    },
    "&:last-child": {
      borderTopRightRadius: "6px",
      borderBottomRightRadius: "6px",
    },
    padding: "0 !important",
    border: "unset !important",
    backgroundColor: theme.colors.slate[0],
    // color: theme.colors.slate[5] + "!important",

    // marginBottom: 14,
  },

  Td: {
    "&:first-child": {
      borderTopLeftRadius: "6px",
      borderBottomLeftRadius: "6px",
    },
    "&:last-child": {
      borderTopRightRadius: "6px",
      borderBottomRightRadius: "6px",
    },
    paddingTop: "20px !important",
    paddingBottom: "20px !important",
    fontSize: theme.fontSizes.sm + "px !important",
    color: theme.colors.slate[7] + "!important",
    border: "unset !important",
    backgroundColor: "#FFFFFF",
    // marginBottom: 14,
  },
  ["th:first-child"]: {
    backgroundColor: "blue",
  },
  // tr:first-child td:last-child { border-top-right-radius: 10px; }

  control: {
    width: "100%",
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,

    "&:hover": {
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0],
    },
  },

  icon: {
    width: 21,
    height: 21,
    borderRadius: 21,
  },
}));

interface RowData {
  name: string;
  email: string;
  company: string;
}

interface TableSortProps {
  data: RowData[];
}

interface ThProps {
  children: React.ReactNode;
  reversed: boolean;
  sorted: boolean;
  onSort(): void;
}

interface TdProps {
  children: React.ReactNode;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const { colors } = useTheme() as MantineTheme;
  const { classes } = useStyles();
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control} py={12}>
        <Group position="apart">
          <Text weight={500} size="sm" color={"slate.5"}>
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon size={14} stroke={1.5} color={colors.slate[5]} />
          </Center>
        </Group>
      </UnstyledButton>
    </th>
  );
}

function filterData(data: RowData[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    keys(data[0]).some((key) => item[key].toLowerCase().includes(query))
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

function Td({ children }: TdProps) {
  const { classes } = useStyles();

  return (
    <>
      <td className={classes.Td}>{children}</td>
    </>
  );
}

export default function TableAdvancedOld({ data }: TableSortProps) {
  const [search, setSearch] = useState("");
  const [sortedData, setSortedData] = useState(data);
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(sortData(data, { sortBy, reversed: reverseSortDirection, search: value }));
  };

  const rows = sortedData.map((row) => (
    <>
      <tr key={row.name}>
        <Td>{row.name}</Td>
        <Td>{row.email}</Td>
        <Td>{row.company}</Td>
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

  return (
    <ScrollArea>
      {/* <TextInput
        placeholder="Search by any field"
        mb="md"
        icon={<IconSearch size={14} stroke={1.5} />}
        value={search}
        onChange={handleSearchChange}
      /> */}
      <Table
        horizontalSpacing="md"
        verticalSpacing="xs"
        sx={{ tableLayout: "fixed", minWidth: 700 }}
      >
        <thead>
          <tr>
            <Th
              sorted={sortBy === "name"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("name")}
            >
              الاسم
            </Th>
            <Th
              sorted={sortBy === "email"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("email")}
            >
              الشركة
            </Th>
            <Th
              sorted={sortBy === "company"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("company")}
            >
              الرقم
            </Th>
          </tr>
        </thead>
        {/* space */}
        <tbody>
          <tr>
            <Box component="td" py={"6px !important"}></Box>
          </tr>
        </tbody>
        {/* end-of-space */}
        <tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <tr>
              <td colSpan={Object.keys(data[0]).length}>
                <Text weight={500} align="center">
                  لايوجد محتوى
                </Text>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </ScrollArea>
  );
}
