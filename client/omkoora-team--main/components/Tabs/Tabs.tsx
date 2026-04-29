import React from "react";
import { Tabs as TabsUI, TabsProps } from "@mantine/core";

type Props = {} & TabsProps;

const Tabs = (props: Props) => {
  return (
    <TabsUI
      {...props}
      sx={({ colors, fontSizes }) => ({
        height: 42,
        "& .mantine-rtl-Tabs-tabsList": {
          height: "100%",
          borderTop: "unset",
          gap: 4,
        },

        "& .mantine-rtl-Tabs-tab": {
          // borderTop: "3px solid " + colors.slate[2],

          backgroundColor: colors.slate[2],
          borderRadius: 0,
          paddingLeft: 22,
          paddingRight: 22,
          color: colors.slate[5],
          fontSize: fontSizes.sm + "px",
          fontWeight: 500,
          borderLeft: "1px solid " + colors.slate[1],
          borderRight: "1px solid " + colors.slate[1],
          transition: "all 0.3s ease",
          borderBottom: "unset",

          "&[data-active]": {
            backgroundColor: colors.slate[1],
            borderLeft: "1px solid " + colors.gray[3],
            borderRight: "1px solid " + colors.gray[3],
            borderBottom: "1px solid " + colors.slate[1],
            marginBottom: -2,
            color: colors.violet[5],
            "&:hover": {
              borderColor: "unset",
              borderLeftColor: "#d1d5db",
              borderRightColor: "#d1d5db",
              borderBottomColor: "transparent",
            },
          },
        },
      })}
    >
      {props.children}
    </TabsUI>
  );
};

export default Tabs;
