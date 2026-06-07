// src/services/exportService.js
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

// Exportar a Excel
export const exportToExcel = (data, filename, columns) => {
    const worksheetData = data.map(item => {
        const row = {};
        columns.forEach(col => {
            row[col.label] = item[col.field];
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

    const maxWidths = [];
    columns.forEach((col, idx) => {
        const maxLabelLength = col.label.length;
        const maxDataLength = Math.max(...data.map(row => String(row[col.field] || '').length), 0);
        maxWidths[idx] = Math.max(maxLabelLength, maxDataLength, 10);
    });
    worksheet['!cols'] = maxWidths.map(w => ({ wch: Math.min(w, 50) }));

    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Exportar a PDF
export const exportToPDF = (data, title, subtitle, columns) => {
    const doc = new jsPDF('landscape');

    doc.setFontSize(18);
    doc.setTextColor(45, 106, 159);
    doc.text(title, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${subtitle} - Generado: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = data.map(item => columns.map(col => item[col.field] || ''));
    const headers = columns.map(col => col.label);

    autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [45, 106, 159], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
    });

    doc.save(`${title.replace(/\s/g, '_')}.pdf`);
};

// Exportar tickets
export const exportTickets = (tickets, type, userType) => {
    const columns = [
        { field: 'ticketNumber', label: 'N° Ticket' },
        { field: 'title', label: 'Título' },
        { field: 'status', label: 'Estado' },
        { field: 'priority', label: 'Prioridad' },
        { field: 'levelName', label: 'Nivel' },
        { field: 'createdAt', label: 'Fecha creación' },
        { field: 'updatedAt', label: 'Última actualización' },
    ];

    const formattedData = tickets.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt).toLocaleString(),
        updatedAt: new Date(t.updatedAt).toLocaleString(),
    }));

    const title = userType === 'tech' ? 'Mis_Tickets_Asignados' : 'Reporte_Tickets';
    const subtitle = `Total: ${tickets.length} tickets | Usuario: ${localStorage.getItem('fullName')}`;

    if (type === 'excel') {
        exportToExcel(formattedData, title, columns);
    } else {
        exportToPDF(formattedData, title, subtitle, columns);
    }
};

// Exportar estadísticas
export const exportStatistics = (stats, chartData, type) => {
    const title = 'Estadisticas_Tickets';
    const subtitle = `Generado: ${new Date().toLocaleString()}`;

    const data = [
        { metric: 'Total Tickets', value: stats.total },
        { metric: 'Abiertos', value: stats.abiertos || 0 },
        { metric: 'En Proceso', value: stats.enProceso || 0 },
        { metric: 'Escalados', value: stats.escalados || 0 },
        { metric: 'Resueltos', value: stats.resueltos || 0 },
        { metric: 'Cerrados', value: stats.cerrados || 0 },
        { metric: 'Vencidos', value: stats.vencidos || 0 },
    ];

    const columns = [
        { field: 'metric', label: 'Métrica' },
        { field: 'value', label: 'Valor' },
    ];

    exportToExcel(data, title, columns);
};

// Exportar detalle completo de un ticket a PDF
export const exportTicketDetailToPDF = (ticket, actions, extraData) => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.setTextColor(45, 106, 159);
    doc.text(`Ticket ${ticket.ticketNumber}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);

    let yPos = 45;

    // Información del ticket
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('INFORMACIÓN DEL TICKET', 14, yPos);
    yPos += 8;

    const ticketInfo = [
        ['Título:', ticket.title],
        ['Estado:', ticket.status],
        ['Prioridad:', ticket.priority],
        ['Nivel:', ticket.levelName],
        ['Solicitante:', extraData.requesterName || `ID: ${ticket.userId}`],
        ['Técnico asignado:', extraData.technicianName || 'No asignado'],
        ['Servicio:', extraData.serviceName || '—'],
        ['Tipo de daño:', extraData.damageName || '—'],
        ['Ubicación:', ticket.location || '—'],
        ['Equipo/Activo:', ticket.assetCode || '—'],
        ['Creado:', new Date(ticket.createdAt).toLocaleString()],
        ['Actualizado:', new Date(ticket.updatedAt).toLocaleString()],
    ];

    autoTable(doc, {
        startY: yPos,
        body: ticketInfo,
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 140 } },
        margin: { left: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Descripción del problema
    doc.setFontSize(14);
    doc.text('DESCRIPCIÓN DEL PROBLEMA', 14, yPos);
    yPos += 8;
    doc.setFontSize(10);
    const splitDesc = doc.splitTextToSize(ticket.description || 'No hay descripción', 180);
    doc.text(splitDesc, 14, yPos);
    yPos += splitDesc.length * 5 + 10;

    // Solución aplicada
    const resolutionAction = actions?.find(a => a.actionType === 'Resolution');
    if (resolutionAction && resolutionAction.description) {
        doc.setFontSize(14);
        doc.text('SOLUCIÓN APLICADA', 14, yPos);
        yPos += 8;
        doc.setFontSize(10);
        const splitSol = doc.splitTextToSize(resolutionAction.description, 180);
        doc.text(splitSol, 14, yPos);
        yPos += splitSol.length * 5 + 10;
    }

    // Motivo de rechazo
    const rejectionAction = actions?.find(a => a.actionType === 'Rejection');
    if (rejectionAction && rejectionAction.description) {
        doc.setFontSize(14);
        doc.setTextColor(239, 68, 68);
        doc.text('RECHAZO DE SOLUCIÓN', 14, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const splitRej = doc.splitTextToSize(rejectionAction.description, 180);
        doc.text(splitRej, 14, yPos);
        yPos += splitRej.length * 5 + 10;
    }

    // Historial
    if (actions && actions.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('HISTORIAL DEL TICKET', 14, yPos);
        yPos += 8;

        const historyData = actions.slice(0, 20).map(a => [
            new Date(a.createdAt).toLocaleString(),
            a.actionType,
            a.description?.substring(0, 80) || ''
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Fecha', 'Acción', 'Descripción']],
            body: historyData,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [45, 106, 159], textColor: 255 },
            columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 25 }, 2: { cellWidth: 110 } },
            margin: { left: 14 },
        });
    }

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Help Desk - Ticket ${ticket.ticketNumber} - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Ticket_${ticket.ticketNumber}_detalle.pdf`);
};