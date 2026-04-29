import { useTheme } from "@emotion/react";
import { Box, Button, Col, Container, Grid, Group, MantineTheme, Stack, TextInput, Title, Pagination, Divider } from "@mantine/core";
import { Lock, Plus, Search } from "tabler-icons-react";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import CardStadium from "../components/Card/CardStadium";
import CardReservation from "../components/Card/CardReservation"; // Import CardReservation
import { searchSortedData, sortedData } from "../lib/helpers/sort";
import { AddStadium, DeleteStadium, UpdateStadium,DeleteReservation } from "../components/Modal";
import { useAllStadium,useAllReservations,useReservationsByTeam } from "../graphql";
import useStore from "../store/useStore";
import { ReservationsDrawer } from "../components/Drawer";
import { IconChevronRight, IconChevronLeft } from "@tabler/icons-react"


export default function Stadiums() {
  const userData = useStore((state: any) => state.userData);
  const theme = useTheme() as MantineTheme;

  // States
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);
  const [openShowModal, setOpenShowModal] = useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openReservationDeleteModal, setOpenReservationDeleteModal] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedData, setSelectedData] = useState<any>("");

  const [allStadium, setAllStadium] = useState<object[]>([]);
  const [allStadiumSorting, setAllStadiumSorting] = useState<object[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [allAllReservations, setAllReservations] =useState<object[]>([]);

  const [getAllStadium, { loading, error, data: dataAllStadium }] = useAllStadium();
  //const [AllReservations, { loading:loadingReservation, error:errorReservation, data: dataAllReservations  }] = useAllReservations();
  const [ReservationsByTeam, { loading:loadingReservation, error:errorReservation, data: dataAllReservations  }] = useReservationsByTeam();
  
  const [reftech,setReftech] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState(1);




  useEffect(() => {
    if (userData?.person?.member?.team?.id) {
      const idTeam = userData?.person?.member?.team?.id;
      getAllStadium({
        variables: { idTeam },
      });
      ReservationsByTeam({
        variables: { idTeam },
      });

  
      
      
    }

    if (userData && "person" in userData && userData?.person?.member?.classification !== null) {
      // @ts-ignore
      setRole(userData?.person?.member?.classification === "رئيس" ? "1" : "2");
    }

    if (userData && "permission" in userData && userData.permission !== null) {
      const permission = userData?.permission;
      setPermissions(permission?.players?.split(","));
    }
  }, [userData]);

  useEffect(() => {
    console.log("userData",userData?.person?.member?.team?.id)
    if (dataAllStadium && "allStadiumsTeam" in dataAllStadium) {
      
      setAllStadium([...dataAllStadium.allStadiumsTeam]);
      
  
    
    }
  }, [dataAllStadium]);



  useEffect(() => {
    if (allStadium.length >= 0) {
      const filterAllStadium = sortedData(allStadium);
      setAllStadiumSorting([...filterAllStadium]);
    }
    console.log("allStadium:",allStadium)
  }, [allStadium]);

  useEffect(() => {
    useStore.setState({ isLayoutDisabled: false });
  }, []);

  useEffect(() => {
    console.log("*** dataAllReservations",dataAllReservations)
    
    if (dataAllReservations && "reservationsByTeam" in dataAllReservations) {
      setAllReservations(dataAllReservations?.reservationsByTeam)
    }
  }, [dataAllReservations]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearchValue(value);

    const filterAllStadium = searchSortedData(allStadium, ['name'], value);
    setAllStadiumSorting([...filterAllStadium]);
  };

  const hasPermission = (permission: string) => {
    if (role && role === "1") {
      return true;
    } else {
      if (permissions && permissions.length > 0) {
        const permissionChecked = permissions.filter((item: string) => item === permission);
        return permissionChecked.length > 0;
      } else return false;
    }
  };

  if (!hasPermission("1")) {
    return (
      <Box>
        <Head>
          <title>طموح</title>
        </Head>
        <Container size={"xl"}>
          <Stack justify={"center"} align={"center"} h={"calc(100vh - 200px)"}>
            <Lock color={theme.colors.gray[4]} size={100} strokeWidth={1.5} />
            <Title size={"h5"} color={theme.colors.gray[5]}>
              ليس لديك الاذن بإكتشاف محتوى الصفحة
            </Title>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Head>
        <title>طموح</title>
      </Head>
      <Container size={"xl"}>
        <Box mb={30} mt={"20px"}>
          <Group position={"apart"}>
            <TextInput
              value={searchValue}
              icon={<Search color={theme.colors.gray[4]} size={16} />}
              placeholder="بحث"
              onChange={handleSearchChange}
            />
            {hasPermission("2") && (
              <Button
                rightIcon={<Plus size={16} strokeWidth="3" />}
                sx={{ fontWeight: 500 }}
                onClick={() => setOpenAddModal(true)}
                color={"primary"}
              >
                إضافة ملعب
              </Button>
            )}
          </Group>
        </Box>

        <Grid>
          {allStadiumSorting.map((item: any, index) => (
            <Col key={index} span={12}  xs={6} md={4} lg={3}>
              <CardStadium
                data={item}
                onEditModal={(data) => {
                  setOpenEditModal(true);
                  setSelectedData(data!());
                }}
                onDeleteModal={(data) => {
                  setOpenDeleteModal(true);
                  setSelectedData(data!());
                }}
                setOpenShowModal={(data) => {
                  setOpenShowModal(true);
                  setSelectedData(data!());
                }}
                hasPermission={hasPermission}
                
              />
            </Col>
          ))}
        </Grid>
        <Divider style={{marginTop:"25px",marginBottom:"25px"}}/>
        {/* New Reservations Section */}
        <Title size="h4" mb="20px">
          الحجوزات
        </Title>
        <Grid>
          {allAllReservations.map((reservation, index) => (
            <Col key={index} span={12}  xs={6} md={4} lg={3}>
              <CardReservation
                
                onDeleteModal={(data) => {
                  setOpenReservationDeleteModal(true);
                  setSelectedData(data!());
                }}
               
                hasPermission={hasPermission}
                refetchReservations = {()=> {
                  console.log("reftech",reftech);
                  setReftech(!reftech)}}
                
              />
            </Col>
          ))}
        </Grid>

        {/* Pagination Component */}
        <Group position="center" mt={20}> 
        <Pagination
            total={Math.ceil(allAllReservations.length / 8)}
            value={currentPage}
            onChange={setCurrentPage}
            nextIcon={() => <IconChevronLeft size={16} />}  
            previousIcon={() => <IconChevronRight size={16} />}
        />
        </Group>
      </Container>

      {/* Portal Components */}
      <AddStadium title="اضافة ملعب" opened={openAddModal} onClose={() => setOpenAddModal(false)} />
      <DeleteStadium title="" opened={openDeleteModal} data={selectedData} onClose={() => setOpenDeleteModal(false)} />
      <DeleteReservation title="" opened={openReservationDeleteModal} data={selectedData} onClose={() => setOpenReservationDeleteModal(false)} />
      
      <UpdateStadium title="تعديل الملعب" opened={openEditModal} data={selectedData} onClose={() => setOpenEditModal(false)} />
      <ReservationsDrawer data={selectedData?.id as string} opened={openShowModal} onClose={() => setOpenShowModal(false)} />
    </Box>
  );
}
