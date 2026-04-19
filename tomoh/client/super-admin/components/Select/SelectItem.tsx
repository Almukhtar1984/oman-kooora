import { Box, Group, Text } from "@mantine/core";
import Avvvatars from "avvvatars-react";
import { forwardRef } from "react";
interface ItemProps extends React.ComponentPropsWithoutRef<"div"> {
  label: string;
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(({ label, ...others }: ItemProps, ref) => (
  <div ref={ref} {...others}>
    <Group noWrap>
      <Box
        sx={({ colors }) => ({
          border: "1px solid " + colors.gray[3],
          borderRadius: "50%",
        })}
      >
        <Avvvatars
          value={label}
          style="shape"
          size={34}
          border={true}
          borderColor="#FFFFFF"
          borderSize={2}
        />
      </Box>

      <div>
        <Text size="sm">{label}</Text>
        {/* <Text size="xs" opacity={0.65}>
            {description}
          </Text> */}
      </div>
    </Group>
  </div>
));

SelectItem.displayName = "SelectItem";
export default SelectItem;
