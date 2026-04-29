import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file with Arabic headers.
 * @param data Array of objects to export
 * @param fileName Name of the file (without extension)
 */
export const exportToExcel = (data: any[], fileName: string) => {
    // Map data to Arabic headers
    const worksheetData = data.map(item => ({
        'الاسم': `${item?.first_name || ''} ${item?.second_name || ''} ${item?.third_name || ''} ${item?.tribe || ''}`.trim(),
        'الرقم المدني': item?.card_number || '-',
        'رقم الهاتف': item?.phone || '-',
        'تاريخ الميلاد': item?.date_birth || '-',
        'تاريخ العضوية': item?.membership_date || '-',
        'تاريخ الاشتراك': item?.subscription_date || '-',
        'الحالة': getStatusLabel(item)
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

    // Set RTL direction if possible (xlsx-js doesn't support full RTL files easily, but we set headers)
    
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

const getStatusLabel = (data: any) => {
    const year = new Date(data?.subscription_date).getFullYear();
    const date1 = new Date(`${year + 1}-01-01`);
    const date2 = new Date();
    return date2 >= date1 ? 'منتهي' : 'يعمل';
};
