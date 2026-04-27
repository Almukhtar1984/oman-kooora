import {
    Box,
    Button,
    Col,
    Grid,
    Group,
    Text,
  } from "@mantine/core";
  import { IconCheck, IconX } from "@tabler/icons-react";
  import { useForm } from "react-hook-form";
  import Modal, { Props as ModalProps } from "./Modal";
  import { useFreePlayer, AllPlayers } from "../../graphql";
  import { Notyf } from "notyf";
  
  type Props = {
    id?: string;
    data?: any;
  } & ModalProps;
  
  export const FreePlayerModal = ({ id, ...props }: Props) => {
    const { handleSubmit, reset } = useForm();
    const [freePlayer] = useFreePlayer();
  
    const onSubmit = () => {
      const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
      freePlayer({
        variables: { id: id },
        refetchQueries: [AllPlayers],
        onCompleted: () => {
          closeModal();
          notyf?.success("تم تحرير اللاعب");
        },
        onError: ({ graphQLErrors }) => {
          console.error("Error freeing player:", graphQLErrors);
          notyf?.error("فشل تحرير اللاعب");
        },
      });
    };
  
    const closeModal = () => {
      props.onClose();
      reset();
    };
  
    return (
      <Modal
        {...props}
        onClose={closeModal}
        footer={
          <Box py={16} px={20} bg="slate.0">
            <Group position={"right"} spacing={"xs"}>
              <Button
                variant="outline"
                rightIcon={<IconX size={15} />}
                bg="white"
                onClick={closeModal}
              >
                إلغاء
              </Button>
              <Button rightIcon={<IconCheck size={15} />} type="submit" form="submit_form">
                تأكيد
              </Button>
            </Group>
          </Box>
        }
      >
        <Box sx={({ colors }) => ({ padding: 20 })}>
          <form onSubmit={handleSubmit(onSubmit)} id="submit_form">
            <Grid gutter={20}>
              <Col span={12}>
                <Text size="md" align="center" mb={10}>
                  هل أنت متأكد أنك تريد تحرير هذا اللاعب من الفريق؟
                </Text>
              </Col>
            </Grid>
          </form>
        </Box>
      </Modal>
    );
  };
  