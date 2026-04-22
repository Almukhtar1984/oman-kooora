import {Text, DefaultMantineColor,} from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import { openConfirmModal } from "@mantine/modals";
import { OpenConfirmModal } from "@mantine/modals/lib/context";

export type Props = {
    bodyContent?: string;
    modalColor?: DefaultMantineColor;
    hideCloseButton?: boolean;
} & OpenConfirmModal;

const ConfirmModal = (props?: Props) => {
    // const { children, footer } = props;

    openConfirmModal({
        title: "Please confirm your action",
        centered: true,
        closeOnClickOutside: false,
        // transition: "fade",
        // transitionDuration: 600,
        // transitionTimingFunction: "ease",
        // sx: ({ colors, fontSizes }) => ({
        //     [".mantine-rtl-Modal-modal"]: {
        //         padding: 0,
        //     },
        //     [".mantine-rtl-Modal-header"]: {
        //         display: props?.hideCloseButton ? "none" : "flex",
        //         padding: 20,
        //         borderBottom: "1px solid " + colors.slate[2],
        //         marginRight: 0,
        //         marginBottom: 0,
        //     },
        //     [".mantine-rtl-Modal-title"]: {
        //         color: props?.modalColor || colors.slate[7],
        //         fontSize: fontSizes.xl + "px",
        //         marginRight: 0,
        //     },
        //     [".mantine-rtl-ActionIcon-root"]: {
        //         background: colors.slate[1],
        //     },
        // }),
        children: (
            <Text size="lg" px={20} pt={16} color="gray.8">
                {props?.bodyContent}
            </Text>
        ),
        labels: {
            confirm: "تأكيد",
            cancel: "إلغاء",
        },

        groupProps: {
            bg: "slate.0",
            py: 14,
            px: 20,
            spacing: "xs",
        },
        confirmProps: {
            rightIcon: <Check size={15} />,
            variant: "filled",
            color: props?.modalColor || "violet",
            autoFocus: true,
        },
        cancelProps: {
            variant: "outline",
            rightIcon: <X size={15} />,
            bg: "white",
            color: props?.modalColor || "violet"
        },
        onCancel: () => console.log("Cancel"),
        onConfirm: () => console.log("Confirmed"),
        ...props,
    });
};

export default ConfirmModal;
