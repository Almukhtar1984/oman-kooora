import { useState } from "react";
import {
  createStyles,
  Table as TableUI,
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
import Td from "./Td";
import Th from "./Th";

type TableProps = {
  tHead?: any;
  children?: any;
};

export default function Table({ tHead, children }: TableProps) {
  return (
    <ScrollArea>
      {/* <TextInput
        placeholder="Search by any field"
        mb="md"
        icon={<IconSearch size={14} stroke={1.5} />}
        value={search}
        onChange={handleSearchChange}
      /> */}
      <TableUI
        horizontalSpacing="md"
        verticalSpacing="xs"
        sx={{ tableLayout: "fixed", minWidth: 700 }}
      >
        <thead>{tHead}</thead>
        {/* space */}
        <tbody>
          <tr>
            <Box component="td" py={"6px !important"}></Box>
          </tr>
        </tbody>
        {/* end-of-space */}
        <tbody>{children}</tbody>
      </TableUI>
    </ScrollArea>
  );
}
