import { useState } from "react";
import {
  createStyles,
  Navbar,
  UnstyledButton,
  Tooltip,
  Title,
  Box,
  Flex,
  Center,
  MantineTheme,
} from "@mantine/core";
import {
  Home2,
  Gauge,
  DeviceDesktopAnalytics,
  Fingerprint,
  CalendarStats,
  User,
  Settings,
  Briefcase,
  BinaryTree2,
} from "tabler-icons-react";
import Image from "next/image";
import { useTheme } from "@emotion/react";
import useStore from "../../store/useStore";
import Link from "next/link";
import { useRouter } from "next/router";
// import { MantineLogo } from '@mantine/ds';

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: "flex",
  },

  aside: {
    flex: "0 0 70px",
    backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderRight: `0.5px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
  },

  main: {
    flex: 1,
    backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.slate[0],
    borderRight: `0.5px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
  },

  mainLink: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.colors.gray[7],

    "&:hover": {
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[0],
    },
  },

  mainLinkActive: {
    "&, &:hover": {
      backgroundColor: theme.fn.variant({ variant: "light", color: theme.primaryColor }).background,
      color: theme.fn.variant({ variant: "light", color: theme.primaryColor }).color,
    },
  },

  title: {
    boxSizing: "border-box",
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    // fontWeight: 400,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    color: theme.colors.gray[7],
    padding: theme.spacing.md,
    paddingTop: 18,
    height: 60,
    borderBottom: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
  },

  logo: {
    boxSizing: "border-box",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    height: 60,
    // paddingTop: theme.spacing.md,
    borderBottom: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.colors.gray[3]
    }`,
    marginBottom: theme.spacing.xl,
  },

  link: {
    boxSizing: "border-box",
    display: "block",
    textDecoration: "none",
    borderTopRightRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.colors.gray[6],
    padding: `0 ${theme.spacing.md}px`,
    fontSize: theme.fontSizes.sm,
    marginRight: theme.spacing.md,
    fontWeight: 500,
    height: 44,
    lineHeight: "44px",

    "&:hover": {
      backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[1],
      color: theme.colorScheme === "dark" ? theme.white : theme.black,
    },
  },

  linkActive: {
    "&, &:hover": {
      borderLeftColor: theme.fn.variant({ variant: "filled", color: theme.primaryColor })
        .background,
      backgroundColor: theme.fn.variant({ variant: "filled", color: theme.primaryColor })
        .background,
      color: theme.white,
    },
  },
}));

const mainLinksMockdata = [
  { icon: Home2, label: "الرئيسية" },
  { icon: Briefcase, label: "الموظفين" },
  { icon: Fingerprint, label: "الحظور والانصراف" },
  { icon: DeviceDesktopAnalytics, label: "مبيعات الموظفين", link: "/sales" },
  { icon: BinaryTree2, label: "الفروع", link: "/branches" },
  { icon: Settings, label: "الإعدادات" },
];

const linksMockdata = [
  [],
  // ["بيانات الموظفين", "طلبات الموظفين", "رواتب الموظفين", "تقارير عامة للموظفيين"],
  [
    {
      name: "بيانات الموظفين",
      link: "/",
    },
    {
      name: "طلبات الموظفين",
      link: "/requests",
    },
    {
      name: "رواتب الموظفين",
      link: "/wages",
    },
    {
      name: "تقارير عامة للموظفيين",
    },
  ],
  [],
  [],
  [],
  [
    {
      name: "إعدادات الموظفين",
      link: "/employeeSettings",
    },
    {
      name: "إعدادات عامة",
    },
  ],
];

export default function SidebarAdvanced() {
  const { classes, cx } = useStyles();
  const [active, setActive] = useState("Releases");
  const [activeLink, setActiveLink] = useState("Settings");
  const navbarItemSelected = useStore((state: any) => state?.navbarItemSelected);
  const theme = useTheme() as MantineTheme;
  const router = useRouter();
  const mainLinks = mainLinksMockdata.map((link, index) => (
    <Tooltip label={link.label} position="right" withArrow key={link.label}>
      <UnstyledButton
        onClick={() => {
          setActive(link.label);
          useStore.setState({ navbarItemSelected: index });
          router.push(link?.link ?? router.pathname);
        }}
        className={cx(classes.mainLink, { [classes.mainLinkActive]: link.label === active })}
      >
        <link.icon
          // stroke={1.5}
          /* color={theme.colors.gray[6]} */
        />
      </UnstyledButton>
    </Tooltip>
  ));

  let isSubListExist = linksMockdata?.[navbarItemSelected]?.length && true;
  const links = linksMockdata?.[navbarItemSelected]?.map((link) => (
    <Link
      key={link.name}
      className={cx(classes.link, { [classes.linkActive]: activeLink === link.name })}
      href={link?.link || router.pathname}
      onClick={(event) => {
        // event.preventDefault();
        setActiveLink(link.name);
      }}
      // key={link.name}
    >
      {link.name}

      {/* <Box
      component="a"
      className={cx(classes.link, { [classes.linkActive]: activeLink === link })}
      href="/"
      onClick={(event) => {
        event.preventDefault();
        setActiveLink(link);
      }}
      key={link}
      // sx={({ colors }) => ({
      //   colors: colors.gray[1],
      // })}
    >
      {link}
    </Box> */}
    </Link>
  ));

  return (
    <Navbar height={"100vh"} width={{ xs: isSubListExist ? 300 : 60 }} sx={{ border: "unset" }}>
      <Navbar.Section grow className={classes.wrapper}>
        <div className={classes.aside}>
          <Box className={classes.logo}>
            <Center h={"100%"}>
              <Image src={"/logo.png"} width="44" height="44" alt=""></Image>
            </Center>
          </Box>
          {mainLinks}
        </div>
        <div className={classes.main} style={{ display: isSubListExist ? "" : "none" }}>
          <Title order={4} className={classes.title}>
            {active}
          </Title>

          {links}
        </div>
      </Navbar.Section>
    </Navbar>
  );
}
