import { Box, Grid, Group, useMantineTheme, Stack, Text, Divider, Button } from "@mantine/core";
import { IconX, IconArrowBigLeft, IconArrowBigRight,IconPrinter } from "@tabler/icons-react";
import Modal, { Props as ModalProps } from "./Modal";
import { useEffect } from "react";

const { Col } = Grid;

type Props = {
  opened: boolean;
  dataMatch?: any;
  onClose: () => void;
} & ModalProps;

export const ShowPlayerListModal = ({ dataMatch, onClose, opened }: Props) => {
  const theme = useMantineTheme();

  const closeModal = () => {
    onClose();
  };

  useEffect(() => {
  }, [dataMatch, opened]);

  const renderPlayer = (
    match: any,
    index: number,
    direction: "starter" | "sub"
  ) => {
    const p = match?.id_participating_player;
    const person = p?.player?.person;
  
    if (!person) return null;
  
    const name = `${person.first_name || ""} ${person.second_name || ""} ${person.third_name || ""}`;
  
    return (
      <Group key={match.id || index} align="center">
        <Text size="md" color={theme.colors.gray[7]}>
          {name}
        </Text>
        {direction === "sub" && match.starter && match.sub && (
          <IconArrowBigRight color="#41b883" fill="#41b883" size={14} />
        )}
        {direction === "starter" && !match.starter && match.sub && (
          <IconArrowBigLeft color="#FF0000" fill="#FF0000" size={14} />
        )}
      </Group>
    );
  };
  
  

  return (
    <Modal
      opened={opened}
      onClose={closeModal}
      size={"80%"}
      title="قائمة اللاعبين"
      styles={{
        body: {
          backgroundColor: theme.colors.gray[1],
        },
        header: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: theme.spacing.sm,
        },
        title: {
          fontSize: theme.fontSizes.lg,
          fontWeight: 700,
        },
        close: {
          marginLeft: theme.spacing.md,
        },
      }}
    >
      <Button
              color={"blue"}
              component={"a"}
              href={`https://print.omkooora.com/#/matchplayerlist/${dataMatch?.id}`}
              target={"_blank"}
              ><IconPrinter size={18} />
                  طباعة القائمة
              </Button>
      <Box style={{ padding: 20 }}>
        <Grid gutter={20}>
          <Col span={6}>
            <Box bg={theme.white} style={{ padding: 20 }}>
              <Text size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>
                {dataMatch?.firstTeam?.team?.name}
              </Text>
              <Divider my="sm" />
              <Stack >
                <Text size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>
                  الاساسين
                </Text>
                {dataMatch?.firstTeamParticipatingPlayersMatch?.map((match: any, index: number) => {
                  if ((match?.starter && !match?.sub) || (!match?.starter && match?.sub)) {
                    return renderPlayer(match, index, "starter");
                  }
                  return null;
                })}
                <Text size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>
                  الاحتياط
                </Text>
                {dataMatch?.firstTeamParticipatingPlayersMatch?.map((match: any, index: number) => {
                  if ((match?.starter && match?.sub) || (!match?.starter && !match?.sub)) {
                    return renderPlayer(match, index, "sub");
                  }
                  return null;
                })}
              </Stack>
            </Box>
          </Col>
          <Col span={6}>
            <Box bg={theme.white} style={{ padding: 20 }}>
              <Text size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>
                {dataMatch?.secondTeam?.team?.name}
              </Text>
              <Divider my="sm" />
              <Stack >
                <Text size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>
                  الاساسين
                </Text>
                {dataMatch?.secondTeamParticipatingPlayersMatch?.map((match: any, index: number) => {
                  if ((match?.starter && !match?.sub) || (!match?.starter && match?.sub)) {
                    return renderPlayer(match, index, "starter");
                  }
                  return null;
                })}
                <Text size={"lg"} fw={"bold"} color={theme.colors.gray[7]}>
                  الاحتياط
                </Text>
                {dataMatch?.secondTeamParticipatingPlayersMatch?.map((match: any, index: number) => {
                  if ((match?.starter && match?.sub) || (!match?.starter && !match?.sub)) {
                    return renderPlayer(match, index, "sub");
                  }
                  return null;
                })}
              </Stack>
            </Box>
          </Col>
        </Grid>
      </Box>
    </Modal>
  );
};
