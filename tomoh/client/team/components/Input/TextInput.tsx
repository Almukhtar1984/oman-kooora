import { TextInputProps, TextInput as TextInputUI } from "@mantine/core";
import React, { forwardRef } from "react";

type Props = {} & TextInputProps;

const TextInput = forwardRef((props: Props, ref) => {
  return (
    <>
      <TextInputUI
        {...props}
        ref={ref as any}
        sx={({ colors }) => ({
          ".mantine-rtl-InputWrapper-label.mantine-rtl-TextInput-label": {
            color: colors.gray[6],
          },
        })}
      >
        {props?.children}
      </TextInputUI>
    </>
  );
});

TextInput.displayName = "TextInput";
export default TextInput;
