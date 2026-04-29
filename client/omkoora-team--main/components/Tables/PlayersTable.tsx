import * as React from 'react';

import { useTheme } from '@table-library/react-table-library/theme';
import {DEFAULT_OPTIONS, getTheme,} from '@table-library/react-table-library/mantine';
import {Table, Header, HeaderRow, Body, Row, HeaderCell, Cell,} from "@table-library/react-table-library/table";

import { usePagination } from '@table-library/react-table-library/pagination';
import {ActionIcon, Avatar, Badge, Checkbox, Group, Menu, Pagination, Text} from '@mantine/core';
import {DotsVertical, FileCertificate, Id, Printer, Upload, Paperclip, EditCircle, Trash,ChartDots,TransferOut,LockOpen} from "tabler-icons-react";
import {Filter} from "tabler-icons-react";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import { Modal } from "@mantine/core";

const mantineTheme = getTheme(DEFAULT_OPTIONS);

interface Props {
    list: any;
    search: string;
    setOpenEditModal?: (open: boolean) => void;
    setOpenDeleteModal?: (open: boolean) => void;
    setSelectedRow: (id: any) => void;
    setOpenAddImageModal?: (open: boolean) => void;
    setOpenTransferModal?: (open: boolean) => void;
    setOpenLoanModal?: (open: boolean) => void;
    setOpenVerifyIdentityModal?: (open: boolean) => void;
    hasPermission: (permission: string) => boolean;
    setOpenAddAttachmentPlayerModal: (open: boolean) => void;
    setStatPlayerModal: (open: boolean) => void;
    setOpenShowAttachmentPlayerModal: (open: boolean) => void;
    setopenConvertToTichnicaleModal: (open: boolean) => void;
    setopenFreeModal:(open: boolean) => void;
}


export const PlayersTable = ({ list, search, setOpenEditModal, setOpenVerifyIdentityModal, setOpenDeleteModal, setSelectedRow, setOpenAddImageModal, setOpenTransferModal, setOpenLoanModal, hasPermission, setOpenAddAttachmentPlayerModal, setOpenShowAttachmentPlayerModal, setStatPlayerModal,setopenConvertToTichnicaleModal,setopenFreeModal }: Props) => {
    const [allMembers, setAllMembers] = useState<{nodes: any}>({
        nodes: []
    });

    const [allTeams, setAllTeams] = useState<string[]>([]);
    const [valueCheck, setValueCheck] = useState<string[]>([]);
    const [dateCheck, setDateCheck] = useState<string[]>([]);
    const [stateCheck, setstateCheck] = useState<string[]>([]);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [openRejectionModal, setOpenRejectionModal] = useState(false);
    const [SelectedPerson, setSelectedPerson] = useState();
    const [typeCheck, setTypeCheck] = useState<string[]>([]);
    useEffect(() => {
        if (typeCheck.length !== 0) {
            const filtered = list.filter((item: any) => typeCheck.includes(item?.type));
            setAllMembers({ nodes: filtered });
        } else {
            setAllMembers({ nodes: [...list] });
        }
    }, [typeCheck, list]);
    
    const theme = useTheme({
        ...mantineTheme,
        HeaderRow: `
            .th {
                text-align: right;
                border-bottom: 1px solid #dee2e6;
                max-height: 62px;
            }
        `,
        BaseCell: `
            padding: 10px 10px;
            text-align: right;
        `,
        Table: `
        --data-table-library_grid-template-columns:  50px 150px 20% 10% 10% 15% 10% 10% 10% 10% 20% 15% 150px 100px 100px;
        min-height: 500px;
        align-content: center;
        `,
    
        BaseRow: `
            .td {
                max-height: 75px;
            }
        `
    });

    const pagination = usePagination(allMembers, {
        state: {
            page: 0,
            size: 10,
        },
        onChange: onPaginationChange,
    });

    useEffect(() => {

       
        setAllMembers({nodes: list})

        let distinct: any = []
        list.map((item: any) => {
            if (distinct.findIndex((item1: any) => item1 === item?.person?.date_birth) == -1)
                distinct.push(item?.person?.date_birth)
        })


        setAllTeams([...distinct])
        setRefresh(!refresh)
    }, [list]);

    useEffect(() => {
        if (valueCheck.length > 0) {
            const filterAllMembers = list.filter((item: any) => valueCheck.includes(item?.person?.date_birth) )

            setAllMembers({nodes: [...filterAllMembers]})
        } else {
            setAllMembers({nodes: [...list]})
        }
    }, [valueCheck]);


    
    useEffect(() => {
        console.log("dateCheck:", dateCheck);
        
        if (dateCheck.length > 0) {
            // Filter members based on whether item.class exists in dateCheck
            const filterAllMembers = list.filter((item: any) => dateCheck.includes(item?.class));
    
            setAllMembers({ nodes: filterAllMembers });
        } else {
            setAllMembers({ nodes: [...list] });
        }
    }, [dateCheck]);
    useEffect(() => {
       //console.log(list)
       if(stateCheck.length !== 0){
            let statusList: string[] = []
            //console.log(list)
            stateCheck.forEach(statu => {
                console.log(statu);
                statusList = statusList.concat(list.filter((item: any) => item?.status === statu ))
            
                });
        setAllMembers({nodes: [...statusList]})
                
        }
        else{

            setAllMembers({nodes: [...list]})
        }
    }, [stateCheck,refresh]);

    function onPaginationChange(action, state) {
        console.log(action, state);
    }

    const openModelDelete = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenDeleteModal === "function" && setOpenDeleteModal(true)
    }
    const openModelFree= (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setopenFreeModal === "function" && setopenFreeModal(true)
    }


    //
    const openModelConvert = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setopenConvertToTichnicaleModal === "function" && setopenConvertToTichnicaleModal(true)
    }


    const openModelUpdate = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenEditModal === "function" && setOpenEditModal(true)
    }

    const openModelAddImage = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenAddImageModal === "function" && setOpenAddImageModal(true)
    }

    const openModelTransfer = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenTransferModal === "function" && setOpenTransferModal(true)
    }

    const openModelLoan = (id: string) => {
        typeof setSelectedRow === "function" && setSelectedRow(id)
        typeof setOpenLoanModal === "function" && setOpenLoanModal(true)
    }

    const openModelVerifyIdentity = (data: any) => {
        typeof setSelectedRow === "function" && setSelectedRow(data)
        typeof setOpenVerifyIdentityModal === "function" && setOpenVerifyIdentityModal(true)
    }

    return (
        <>
            <Table data={allMembers} theme={theme} pagination={pagination} layout={{ custom: true, horizontalScroll: true }}>
                {(tableList) => (
                    <>
                        <Header>
                            <HeaderRow>
                                <HeaderCell>#</HeaderCell>
                                <HeaderCell>الصورة الشخصية</HeaderCell>
                                <HeaderCell>الاسم الكامل</HeaderCell>
                                <HeaderCell>رقم الهاتف</HeaderCell>
                                <HeaderCell>الرقم المدني</HeaderCell>
                                <HeaderCell>
                                    <Group position={"apart"} noWrap={true}>
                                        <Text>تاريخ الميلاد</Text>
                                        <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                                            <Menu.Target>
                                                <ActionIcon>
                                                    <Filter size={18} />
                                                </ActionIcon>
                                            </Menu.Target>

                                            <Menu.Dropdown>
                                                <Checkbox.Group value={dateCheck} onChange={setDateCheck} defaultValue={[]}>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"firstDegree"} label={"الفريق الاول"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"secondDegree"} label={"تحت 23 سنة"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"young"} label={"تحت 18 سنة"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"rookies"} label={"تحت 16 سنة"} />
                                                    </Menu.Item>
                                                </Checkbox.Group>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </HeaderCell>
                                <HeaderCell>الفئة العمرية</HeaderCell>
                                <HeaderCell>النشاط</HeaderCell>
                                <HeaderCell>مركز لاعب</HeaderCell>
                                <HeaderCell>العمل</HeaderCell>
                                <HeaderCell>صورة البطاقة المدنية</HeaderCell>
                                <HeaderCell>
                                <Group position={"apart"} noWrap={true}>
                                        <Text> موافقة ولي الامر</Text>
                                        <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                                            <Menu.Target>
                                                <ActionIcon>
                                                    <Filter size={18} />
                                                </ActionIcon>
                                            </Menu.Target>

                                            <Menu.Dropdown>
                                                <Checkbox.Group value={stateCheck} onChange={setstateCheck} defaultValue={[]}>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"accepted"} label={"مقبول"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"rejected"} label={"مرفوض"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"waiting_club"} label={"قيد انتظار تاكيد النادي"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"waiting"} label={"قيد الانتظار"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"suspended"} label={"معاقب"} />
                                                    </Menu.Item>
                                                </Checkbox.Group>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                </HeaderCell>
                                <HeaderCell>الحالة</HeaderCell>
                                <HeaderCell>
                                    <Group position={"apart"} noWrap={true} sx={{gap:"0px",justifyContent:"flex-start"}}>
                                    <Menu position={"bottom-end"} width={200} closeOnItemClick={false}>
                                            <Menu.Target>
                                                <ActionIcon>
                                                    <Filter size={18} />
                                                </ActionIcon>
                                            </Menu.Target>

                                            <Menu.Dropdown>
                                                <Checkbox.Group value={typeCheck} onChange={setTypeCheck}>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"internal"} label={"داخلي"} />
                                                    </Menu.Item>
                                                    <Menu.Item component={"div"}>
                                                        <Checkbox value={"external"} label={"محترف"} />
                                                    </Menu.Item>
                                                </Checkbox.Group>
                                            </Menu.Dropdown>
                                        </Menu>
                                        <Text>النوع</Text>
                                        
                                    </Group>
                                </HeaderCell>

                                <HeaderCell>الخيارات</HeaderCell>
                            </HeaderRow>
                        </Header>

                        <Body>
                            {tableList.map((item, index) => (
                                <Row key={item.id} item={item}>
                                    <Cell>{index+1}</Cell>
                                    <Cell>
                                        <Avatar
                                            w={50} h={50}
                                            src={item?.person?.personal_picture ? `${process.env.NEXT_PUBLIC_API_URL}/images/${item?.person?.personal_picture}` : ""}
                                            alt="it's me"
                                        />
                                    </Cell>
                                    <Cell>{`${item?.person?.first_name} ${item?.person?.second_name} ${item?.person?.third_name} ${item?.person?.tribe}`}</Cell>
                                    <Cell>{item?.person?.phone}</Cell>
                                    <Cell>{item?.person?.card_number}</Cell>
                                    <Cell>{item?.person?.date_birth} ({dayjs(item?.person?.date_birth).locale("ar").fromNow(true)})</Cell>
                                    <Cell>
                                        {item?.class == "firstDegree"
                                            ? <Badge color="lime">الفريق الاول</Badge>
                                            : item?.class == "secondDegree"
                                                ? <Badge color="orange">تحت 23 سنة</Badge>
                                                : item?.class == "young"
                                                    ? <Badge color="grape">تحت 18 سنة</Badge>
                                                    :  item?.class == "rookies"
                                                        ? <Badge color="indigo">تحت 16 سنة</Badge>
                                                        : null
                                        }
                                    </Cell>
                                    <Cell>{item?.activity}</Cell>
                                    <Cell>{item?.player_center}</Cell>
                                    <Cell>{item?.job}</Cell>
                                    <Cell>
                                        { item.nationalID && item.nationalID !== "" ?
                                            <Group position={"center"}>
                                                <ActionIcon
                                                    color="green"
                                                    variant="light"

                                                    component="a"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={`${process.env.NEXT_PUBLIC_API_URL}/images/${item.nationalID}`}
                                                >
                                                    <Id size={18} />
                                                </ActionIcon>
                                                <Text size={"sm"}>واجهة امامية</Text>
                                            </Group>
                                            : null
                                        }
                                        { item.nationalIDBack && item.nationalIDBack !== "" ?
                                            <Group position={"center"}>
                                                <ActionIcon
                                                    color="green"
                                                    variant="light"

                                                    component="a"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={`${process.env.NEXT_PUBLIC_API_URL}/images/${item.nationalIDBack}`}
                                                >
                                                    <Id size={18} />
                                                </ActionIcon>
                                                <Text size={"sm"}>واجهة خلفية</Text>
                                            </Group>
                                            : null
                                        }
                                    </Cell>

                                    <Cell>
                                        {item.parentApproval && item.parentApproval !== "" ?
                                            <Group position={"center"}>
                                                <ActionIcon
                                                    color="green"
                                                    variant="light"

                                                    component="a"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    href={`${process.env.NEXT_PUBLIC_API_URL}/images/${item.parentApproval}`}
                                                >
                                                    <FileCertificate size={18} />
                                                </ActionIcon>
                                                <Text size={"sm"}>الاستمارة</Text>
                                            </Group>
                                            : null
                                        }
                                    </Cell>
                                    
                                    <Cell>
                                    {
                                    item?.status == "accepted"
                                        ? <Badge fw={500} color="teal">مقبول</Badge>
                                        : item?.status == "rejected"
                                            ? <Badge sx={{cursor:"pointer"}}fw={500} color="red"  onClick={(e) => { e.stopPropagation(); setOpenRejectionModal(true);setSelectedPerson(item.note) }}>مرفوض</Badge>
                                            : item?.status == "waiting_club"
                                                ? <Badge fw={500} color="yellow">قيد انتظار تاكيد النادي</Badge>
                                                : item?.status == "suspended"
                                                    ? <Badge fw={500} color="red">معاقب</Badge>
                                                    : <Badge fw={500} color="yellow">قيد الانتظار</Badge>
                                           }
                                    </Cell>
                                    <Cell>
                                        {
                                            item?.type === "internal"
                                                ? <Badge color="cyan">داخلي</Badge>
                                                : item?.type === "external"
                                                    ? <Badge color="violet">محترف</Badge>
                                                    : null
                                        }
                                    </Cell>

                                    <Cell>
                                        <Group>
                                            <Menu shadow="md" width={200} position={"bottom"} offset={0}>
                                                <Menu.Target>
                                                    <ActionIcon color="gray" variant="light" >
                                                        <DotsVertical size={18} />
                                                    </ActionIcon>
                                                </Menu.Target>

                                                <Menu.Dropdown>
                                                    {item?.status !== "accepted" && item?.status !== "waiting_club"
                                                        ? <Menu.Item icon={<EditCircle size={18} />} onClick={() => openModelUpdate(item?.id)} >تعديل</Menu.Item>
                                                        : null
                                                    }

                                                    {hasPermission("3")
                                                        ? <Menu.Item icon={<Upload size={18} />} onClick={() => openModelAddImage(item?.person?.id)} >إضافة صورة</Menu.Item>
                                                        : null
                                                    }
                                                    
                                                    {item?.status == "waiting" && hasPermission("4")
                                                        ? <Menu.Item icon={<Id size={14} />} onClick={() => openModelVerifyIdentity(item)} >تحقق</Menu.Item>
                                                        : null
                                                    }

                                                    {item.attachmentsPlayer.length > 0 ?
                                                        <Menu.Item 
                                                            icon={<Paperclip size={18} />}
                                                            onClick={() => {
                                                                setSelectedRow(item)
                                                                setOpenShowAttachmentPlayerModal(true)
                                                            }}
                                                        >المرفقات</Menu.Item>
                                                        : null
                                                    }

                                                    <Menu.Item 
                                                        icon={<Upload size={18} />}
                                                        onClick={() => {
                                                            setSelectedRow(item?.id)
                                                            setOpenAddAttachmentPlayerModal(true)
                                                        }}
                                                    >إضافة مرفقات</Menu.Item>
                                                    <Menu.Item 
                                                        icon={<ChartDots size={18} />}
                                                        onClick={() => {
                                                            setSelectedRow(item?.id)
                                                            setStatPlayerModal(true)
                                                        }}
                                                    >احصائيات اللاعب</Menu.Item>
                                                    
                                                    {hasPermission("5")
                                                        ? <Menu.Item
                                                            component={"a"} icon={<Printer size={18} />}
                                                            href={`https://print.omkooora.com/#/${item?.id}`}
                                                            target={"_blank"}
                                                        >طباعة البطاقة</Menu.Item>
                                                        : null
                                                    }
                                                    {item?.type === "external" 
                                                        ? <Menu.Item icon={<LockOpen size={18} />} onClick={() => openModelFree(item?.id)} >تحريح اللاعب</Menu.Item>
                                                        : null
                                                    }
                                                    {item?.status === "accepted" && item?.type === "internal" 
                                                        ? <Menu.Item icon={<TransferOut size={18} />} onClick={() => openModelConvert(item?.id)} >نقل للجهاز الفني</Menu.Item>
                                                        : null
                                                    }
                                              

                                                    {item?.status !== "accepted" && item?.status !== "waiting_club"
                                                        ? <Menu.Item icon={<Trash size={18} />} onClick={() => openModelDelete(item?.id)} >حذف</Menu.Item>
                                                        : null
                                                    }
                                                </Menu.Dropdown>
                                            </Menu>
                                        </Group>
                                    </Cell>
                                </Row>
                            ))}
                        </Body>
                    </>
                )}
            </Table>

            <br />
            <Group position="right" mx={10}>
                <Pagination
                    total={pagination.state.getTotalPages(allMembers.nodes)}
                    value={pagination.state.page + 1}
                    onChange={(page) => pagination.fns.onSetPage(page - 1)}
                />
            </Group>
            <Modal
                opened={openRejectionModal}
                onClose={() => setOpenRejectionModal(false)}
                title="سبب الرفض"
                centered
            >
             
             <Text>
                {SelectedPerson||"لم يتم ذكر سبب الرفض"}
            </Text>
            </Modal>
        </>
    );
};