import React, { useEffect, useState } from 'react';
import { useDisclosure } from "@mantine/hooks";
import { useCreateSession, handlePaymentRedirect } from "../index";
import { useAddExpense, useUpdateExpenseSessionid } from "../../graphql";
import { Box, Button, LoadingOverlay } from "@mantine/core";

interface PaymentHandlerProps {
    Amount: number;
    idTeam: string;
    clientReferenceId: string;
    customerName: string;
    productsName: string;
    unitAmount: number;
    quantity: number;
    orderId: number;
}

export const PaymentHandler: React.FC<PaymentHandlerProps> = ({
    Amount,
    idTeam,
    clientReferenceId,
    customerName,
    productsName,
    unitAmount,
    quantity,
    orderId
}) => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [IDexpenses, setIDexpenses] = useState<string>();
    const [visible, { open, close }] = useDisclosure(false);

    const { data: dataCreateSession, error: createSessionError, loading: createSessionLoading, post: createSession } = useCreateSession();
   
    const [createExpense, { data: dataAddExpense }] = useAddExpense();
    const [updateExpense] = useUpdateExpenseSessionid();

    const handleTestPayment = async () => {
        open(); // Show loading overlay
        const note = "note";
        createExpense({
            variables: {
                content: {
                    value: Amount,
                    note: note,
                    id_team: idTeam,
                },
            },
            onCompleted: () => {
                console.log("createExpense complted")
                // closeModal();
            },
        });
    };

    useEffect(() => {
        console.log("===== update dataCreateSession")
        if (dataCreateSession) {
            const sessionId = dataCreateSession?.data?.session_id;
           /* updateExpense({
                variables: {
                    id: IDexpenses || "",
                    session_id: sessionId,
                },
                onCompleted: () => {
                    console.log("success");
                     
                setSessionId(sessionId);  // Set the sessionId to start polling
                handlePaymentRedirect(sessionId);  // Redirect to payment page

                },
            });*/
            setSessionId(sessionId);  // Set the sessionId to start polling
            handlePaymentRedirect(sessionId);  // Redirect to payment page

        } else if (createSessionError) {
            console.log("eRror create session")
            console.error('Error creating session:', createSessionError);
            close(); // Hide loading overlay in case of error
        }
    }, [dataCreateSession]);

    const handleCreateSession = async () => {
        if (dataAddExpense) {
            /*const body = {
                amount: Amount,
                currency: "OMR",
                client_reference_id: clientReferenceId,
                success_url: `${process.env.NEXT_PUBLIC_API_PAYMENT_SUCESS}?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.NEXT_PUBLIC_API_PAYMENT_CANCEL}?session_id={CHECKOUT_SESSION_ID}`,
                mode:'payment',
                products: [
                    {
                        name: productsName,
                        unit_amount: unitAmount,
                        quantity: quantity,
                    },
                ],
                metadata: {
                    "Customer name": customerName,
                    "order id": orderId,
                },
            };*/
            const body = {
                "client_reference_id": "123412",
                "mode": "payment",
                "products": [
                  {
                    "name": "product 1",
                    "quantity": 1,
                    "unit_amount": 100
                  }
                ],
                "success_url": "https://thw.om/success",
                "cancel_url": "https://thw.om/cancel",
                "metadata": {
                  "Customer name": "somename",
                  "order id": 0
                }
              }

            console.log("body:",body)
            try {
                await createSession(body);
                console.log('Session created successfully');
            } catch (error) {
                console.error('Error creating session:', error);
            }
        }
    };

    useEffect(() => {
        console.log("dataAddExpense useEffect")
        if (dataAddExpense) {
            setIDexpenses(dataAddExpense?.createExpense.id);
            handleCreateSession();
        }
    }, [dataAddExpense]);



    return (
        <Box>
    
            <Button
                color={"primary"}
                onClick={handleTestPayment} // Attach the handler to the button
                disabled={createSessionLoading} // Disable button while request is loading
            >
                Test Payment 
            </Button>
        </Box>
    );
};


