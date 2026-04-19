import { useTheme } from "@emotion/react";
import { Center, createStyles, Group, MantineTheme, Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronUp, IconSelector } from "@tabler/icons";
import React from "react";

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

type Props = {};
interface ThProps {
  children: React.ReactNode;
  reversed?: boolean;
  sorted?: boolean;
  onSort?(): void;
  noSortIcon?: boolean;
}

const Th = ({ children, reversed, sorted, onSort, noSortIcon, ...rest }: ThProps) => {
  const { colors } = useTheme() as MantineTheme;
  const { classes } = useStyles();
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <th className={classes.th} {...rest}>
      <UnstyledButton onClick={onSort} className={classes.control} py={12}>
        <Group position="apart">
          <Text weight={500} size="sm" color={"slate.5"}>
            {children}
          </Text>
          {!noSortIcon && (
            <Center className={classes.icon}>
              <Icon size={14} stroke={1.5} color={colors.slate[5]} />
            </Center>
          )}
        </Group>
      </UnstyledButton>
    </th>
  );
};

export default Th;
