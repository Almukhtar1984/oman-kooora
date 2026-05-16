import React from "react";
import { Box, Checkbox, Tooltip } from "@mantine/core";

interface Props {
    selected:    boolean;
    onToggle:    () => void;
    children:    React.ReactNode;
    disabled?:   boolean;
    tooltip?:    string;
}

export const SelectableCardWrapper = ({ selected, onToggle, children, disabled, tooltip }: Props) => {
    return (
        <Box sx={{ position: "relative" }}>
            <Box
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) onToggle();
                }}
                sx={(theme) => ({
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 50,
                    background: "white",
                    borderRadius: 8,
                    padding: 4,
                    boxShadow: theme.shadows.xs,
                    border: `1px solid ${selected ? theme.colors.orange[5] : theme.colors.gray[3]}`,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    display: "flex",
                    alignItems: "center",
                })}
            >
                <Tooltip label={tooltip || (selected ? "إلغاء التحديد" : "تحديد")} withArrow>
                    <Checkbox
                        checked={selected}
                        readOnly
                        size="sm"
                        color="orange"
                        sx={{ pointerEvents: "none" }}
                    />
                </Tooltip>
            </Box>
            <Box
                sx={(theme) => ({
                    borderRadius: 24,
                    transition: "outline-color 0.2s",
                    outline: selected
                        ? `2px solid ${theme.colors.orange[5]}`
                        : "2px solid transparent",
                    outlineOffset: -2,
                })}
            >
                {children}
            </Box>
        </Box>
    );
};
