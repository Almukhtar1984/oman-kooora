import { ReactElement, useState } from "react";
import {Modal as ModalUI, ModalProps,} from "@mantine/core";

export type Props = {
    header?: ReactElement;
    footer?: ReactElement;
    size?: string;
} & ModalProps;

function Modal(props: Props) {
    const { children, footer } = props;

    return (
        <>
            <ModalUI
                {...props}
                size={props.size || "xl"}
                centered={true}
                // transition="fade"
                // transitionDuration={600}
                // transitionTimingFunction="ease"
                // sx={({ colors, fontSizes }) => ({
                //     [".mantine-rtl-Modal-modal"]: {
                //         padding: 0,
                //     },
                //     [".mantine-rtl-Modal-header"]: {
                //         padding: 20,
                //         borderBottom: "1px solid " + colors.slate[2],
                //         marginRight: 0,
                //         marginBottom: 0,
                //     },
                //     [".mantine-rtl-Modal-title"]: {
                //         color: colors.slate[7],
                //         fontSize: fontSizes.xl + "px",
                //         marginRight: 0,
                //     },
                //     [".mantine-rtl-ActionIcon-root"]: {
                //         background: colors.slate[1],
                //     },
                // })}
            >
                {/* content */}
                {children}

                {/* footer */}
                {footer}
            </ModalUI>
        </>
    );
}

export default Modal;
