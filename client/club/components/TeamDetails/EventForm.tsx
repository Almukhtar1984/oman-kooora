import { Stack, TextInput, Textarea, FileInput, Button, Box, Text, Group, ActionIcon, Image } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { X } from "tabler-icons-react";
import React, { useState, useEffect } from "react";

interface EventFormProps {
    event?: any;
    onSuccess: () => void;
    idTeam: string;
    createEvent: any;
    updateEvent: any;
}

export const EventForm = ({ event, onSuccess, idTeam, createEvent, updateEvent }: EventFormProps) => {
    const [form, setForm] = useState<any>({
        name: event?.name || "",
        description: event?.description || "",
        date: event?.date ? new Date(event.date) : new Date(),
        images: []
    });
    const [existingImages, setExistingImages] = useState<string[]>(event?.imageList || []);
    const [deletedImages, setDeletedImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            setForm({
                name: event.name,
                description: event.description || "",
                date: new Date(event.date),
                images: []
            });
            setExistingImages(event.imageList || []);
            setDeletedImages([]);
        }
    }, [event]);

    const handleRemoveExisting = (img: string) => {
        setExistingImages(existingImages.filter(i => i !== img));
        setDeletedImages([...deletedImages, img]);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const content = {
                name: form.name,
                description: form.description,
                date: form.date.toISOString(),
                images: form.images,
                id_team: idTeam,
                deletedImages: deletedImages
            };
            if (event) {
                await updateEvent({ variables: { id: event.id, content } });
            } else {
                await createEvent({ variables: { content } });
            }
            onSuccess();
        } catch (err) {
            console.error("Error submitting event form:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack spacing="md">
            <TextInput 
                label="اسم الفعالية" 
                required 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
            />
            <Textarea 
                label="وصف الفعالية" 
                minRows={3} 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
            />
            <DatePickerInput 
                label="تاريخ الفعالية" 
                required 
                value={form.date} 
                onChange={(val) => setForm({ ...form, date: val || new Date() })} 
            />
            
            {existingImages.length > 0 && (
                <Box>
                    <Text size="sm" weight={500} mb={8}>الصور الحالية:</Text>
                    <Group spacing="xs">
                        {existingImages.map((img) => (
                            <Box key={img} sx={{ position: 'relative' }}>
                                <Image 
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/images/events/${event.images}/${img}`} 
                                    width={80} 
                                    height={80} 
                                    radius="sm" 
                                    alt="current" 
                                />
                                <ActionIcon 
                                    variant="filled" 
                                    color="red" 
                                    size="xs" 
                                    sx={{ position: 'absolute', top: -5, right: -5, borderRadius: '50%' }}
                                    onClick={() => handleRemoveExisting(img)}
                                >
                                    <X size={10} />
                                </ActionIcon>
                            </Box>
                        ))}
                    </Group>
                </Box>
            )}
            
            <FileInput 
                label="إضافة صور جديدة" 
                placeholder="اختر الصور" 
                multiple 
                value={form.images} 
                onChange={(val) => setForm({ ...form, images: val })} 
                accept="image/*" 
            />
            
            <Button 
                onClick={handleSubmit} 
                loading={loading} 
                mt="md" 
                fullWidth 
                size="md" 
                color="blue"
            >
                {event ? "تحديث التغييرات" : "حفظ الفعالية"}
            </Button>
        </Stack>
    );
};
