import React, { useState, useEffect } from 'react';
import {
    Save, RefreshCw, Settings, Clock, Target, CheckCircle, AlertCircle,
    Bell, Mail, Shield, Wrench, BookOpen, FileText, Tag,
    Plus, Trash2, Server, Database, Zap
} from 'lucide-react';
import Layout from '../../components/Layout';
import { authAPI, catalogAPI } from '../../services/api';

function SystemConfig() {
    // Estados principales
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('tiempos');

    // Estados por sección
    const [timeConfigs, setTimeConfigs] = useState([]);
    const [generalConfig, setGeneralConfig] = useState({
        notificacionesRealtime: true,
        asignacionAutomatica: true,
        alertasCorreo: true,
        controlSLA: true,
        twoFactorAuth: false,
        modoMantenimiento: false
    });
    const [damageTypes, setDamageTypes] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [newDamage, setNewDamage] = useState('');
    const [newService, setNewService] = useState('');
    const [ticketFormat, setTicketFormat] = useState({
        prefix: 'UTA-',
        includeYear: true,
        includeMonth: false,
        digits: 6
    });

    // Cargar toda la configuración
    useEffect(() => {
        loadAllConfigs();
    }, []);

    const loadAllConfigs = async () => {
        setLoading(true);
        setError('');
        try {
            await Promise.all([
                loadTimeConfigs(),
                loadGeneralConfig(),
                loadDamageCatalog(),
                loadServiceCatalog(),
                loadTicketFormat()
            ]);
        } catch (err) {
            console.error('Error cargando configuraciones:', err);
            setError('Error al cargar la configuración del sistema');
        } finally {
            setLoading(false);
        }
    };

    const loadTimeConfigs = async () => {
        try {
            const res = await authAPI.get('/configuration/levels');
            setTimeConfigs(res.data);
        } catch (err) {
            console.error('Error cargando tiempos:', err);
            setTimeConfigs([
                { level: 1, levelName: 'Soporte Básico', responseHours: 4, resolutionHours: 8 },
                { level: 2, levelName: 'Soporte Técnico', responseHours: 8, resolutionHours: 24 },
                { level: 3, levelName: 'Soporte Avanzado', responseHours: 24, resolutionHours: 48 }
            ]);
        }
    };

    const loadGeneralConfig = async () => {
        try {
            const res = await authAPI.get('/configuration/general');
            if (res.data) setGeneralConfig(res.data);
        } catch (err) {
            console.error('Error cargando configuración general:', err);
        }
    };

    const loadDamageCatalog = async () => {
        try {
            const res = await catalogAPI.get('/damagecatalog');
            // Filtrar solo los activos
            const activeDamages = res.data.filter(d => d.isActive === true);
            setDamageTypes(activeDamages);
        } catch (err) {
            console.error('Error cargando catálogo de daños:', err);
            setDamageTypes([]);
        }
    };

    const loadServiceCatalog = async () => {
        try {
            const res = await catalogAPI.get('/servicecatalog');
            // Filtrar solo los activos
            const activeServices = res.data.filter(s => s.isActive === true);
            setServiceTypes(activeServices);
        } catch (err) {
            console.error('Error cargando catálogo de servicios:', err);
            setServiceTypes([]);
        }
    };

    const loadTicketFormat = async () => {
        try {
            const res = await authAPI.get('/configuration/ticket-format');
            if (res.data) setTicketFormat(res.data);
        } catch (err) {
            console.error('Error cargando formato de ticket:', err);
        }
    };

    // Handlers para tiempos
    const updateTimeConfig = (level, field, value) => {
        setTimeConfigs(prev => prev.map(c =>
            c.level === level ? { ...c, [field]: parseInt(value) || 0 } : c
        ));
    };

    // Handlers para configuración general
    const toggleGeneralConfig = (key) => {
        setGeneralConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Agregar tipo de daño
    const addDamageType = async () => {
        if (!newDamage.trim()) return;
        try {
            const damageData = {
                name: newDamage.trim(),
                code: newDamage.substring(0, 3).toUpperCase(),
                description: `Tipo de daño: ${newDamage.trim()}`
            };

            await catalogAPI.post('/damagecatalog', damageData);
            await loadDamageCatalog(); // Recargar la lista
            setNewDamage('');
            showSuccess('Tipo de daño agregado correctamente');
        } catch (err) {
            console.error('Error al agregar:', err);
            setError(err.response?.data?.message || 'Error al agregar tipo de daño');
        }
    };

    // Eliminar tipo de daño
    const deleteDamageType = async (id) => {
        if (!window.confirm('¿Eliminar este tipo de daño?')) return;
        try {
            await catalogAPI.delete(`/damagecatalog/${id}`);
            await loadDamageCatalog(); // Recargar la lista
            showSuccess('Tipo de daño eliminado');
        } catch (err) {
            console.error('Error al eliminar:', err);
            setError('Error al eliminar tipo de daño');
        }
    };

    // Agregar tipo de servicio
    const addServiceType = async () => {
        if (!newService.trim()) return;
        try {
            // Obtener el primer ID de daño disponible
            let defaultDamageId = 1;
            if (damageTypes.length > 0) {
                defaultDamageId = damageTypes[0].id;
            }

            const serviceData = {
                name: newService.trim(),
                description: `Tipo de servicio: ${newService.trim()}`,
                category: "General",
                attentionLevel: 1,
                estimatedTimeHours: 4,
                damageCatalogId: defaultDamageId,
                isActive: true
            };

            await catalogAPI.post('/servicecatalog', serviceData);
            await loadServiceCatalog(); // Recargar la lista
            setNewService('');
            showSuccess('Tipo de servicio agregado correctamente');
        } catch (err) {
            console.error('Error al agregar servicio:', err);
            setError(err.response?.data?.message || 'Error al agregar tipo de servicio');
        }
    };

    // Eliminar tipo de servicio
    const deleteServiceType = async (id) => {
        if (!window.confirm('¿Eliminar este tipo de servicio?')) return;
        try {
            await catalogAPI.delete(`/servicecatalog/${id}`);
            await loadServiceCatalog(); // Recargar la lista
            showSuccess('Tipo de servicio eliminado');
        } catch (err) {
            console.error('Error al eliminar servicio:', err);
            setError('Error al eliminar tipo de servicio');
        }
    };

    // Guardar todo
    const handleSaveAll = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // Guardar tiempos por nivel
            await authAPI.put('/configuration/levels', { configs: timeConfigs });

            // Guardar configuración general
            await authAPI.put('/configuration/general', generalConfig);

            // Guardar formato de ticket
            await authAPI.put('/configuration/ticket-format', ticketFormat);

            showSuccess('Toda la configuración ha sido guardada correctamente');
        } catch (err) {
            console.error('Error guardando:', err);
            setError('Error al guardar la configuración. Verifique los datos.');
        } finally {
            setSaving(false);
        }
    };

    const showSuccess = (msg) => {
        setSuccess(msg);
        setTimeout(() => setSuccess(''), 3000);
    };

    // Estilos
    const cardStyle = {
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #e4e7eb',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: 24
    };

    const tabs = [
        { id: 'tiempos', label: ' Tiempos SLA', icon: Clock },
        { id: 'general', label: ' General', icon: Settings },
        { id: 'catalogos', label: ' Catálogos', icon: BookOpen },
        { id: 'ticket', label: 'Formato Ticket', icon: Tag }
    ];

    return (
        <Layout>
            <div className="config-container" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center' }}>
                            <Settings size={28} style={{ marginRight: 12, color: '#2d6a9f' }} />
                            Configuración General del Sistema
                        </h1>
                        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                            Gestiona parámetros globales: tiempos SLA, catálogos, formatos y más
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={loadAllConfigs}
                            style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 12, padding: '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <RefreshCw size={16} />
                            Actualizar todo
                        </button>
                    </div>
                </div>

                {/* Alertas */}
                {success && (
                    <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: 14, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center' }}>
                        <CheckCircle size={18} style={{ marginRight: 10 }} />
                        {success}
                    </div>
                )}
                {error && (
                    <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: 14, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center' }}>
                        <AlertCircle size={18} style={{ marginRight: 10 }} />
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e4e7eb', paddingBottom: 0 }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '12px 24px',
                                background: activeTab === tab.id ? '#2d6a9f' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : '#6b7280',
                                border: 'none',
                                borderRadius: '12px 12px 0 0',
                                cursor: 'pointer',
                                fontSize: 14,
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                transition: 'all 0.2s'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}>Cargando configuración del sistema...</div>
                ) : (
                    <>
                        {/* TAB: Tiempos SLA */}
                        {activeTab === 'tiempos' && (
                            <div className="responsive-grid">
                                {timeConfigs.map(config => (
                                    <div key={config.level} style={cardStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: 16,
                                                background: config.level === 1 ? '#eef2ff' : config.level === 2 ? '#ecfdf5' : '#fffbeb',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <span style={{ fontSize: 20, fontWeight: 700, color: '#2d6a9f' }}>N{config.level}</span>
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{config.levelName}</h3>
                                                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Nivel {config.level} de soporte</p>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 16 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                                <Clock size={14} />
                                                Tiempo de respuesta (horas)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={168}
                                                value={config.responseHours}
                                                onChange={(e) => updateTimeConfig(config.level, 'responseHours', e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14 }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                                                <Target size={14} />
                                                Tiempo de resolución (horas)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={720}
                                                value={config.resolutionHours}
                                                onChange={(e) => updateTimeConfig(config.level, 'resolutionHours', e.target.value)}
                                                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TAB: Configuración General */}
                        {activeTab === 'general' && (
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Parámetros del sistema</h3>
                                <div className="responsive-grid">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#f9fafb', borderRadius: 12 }}>
                                        <Bell size={20} color="#2d6a9f" />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={generalConfig.notificacionesRealtime} onChange={() => toggleGeneralConfig('notificacionesRealtime')} />
                                            Notificaciones en tiempo real
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#f9fafb', borderRadius: 12 }}>
                                        <Zap size={20} color="#2d6a9f" />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={generalConfig.asignacionAutomatica} onChange={() => toggleGeneralConfig('asignacionAutomatica')} />
                                            Asignación automática
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#f9fafb', borderRadius: 12 }}>
                                        <Mail size={20} color="#2d6a9f" />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={generalConfig.alertasCorreo} onChange={() => toggleGeneralConfig('alertasCorreo')} />
                                            Alertas por correo
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#f9fafb', borderRadius: 12 }}>
                                        <Server size={20} color="#2d6a9f" />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={generalConfig.controlSLA} onChange={() => toggleGeneralConfig('controlSLA')} />
                                            Control de SLA
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#f9fafb', borderRadius: 12 }}>
                                        <Shield size={20} color="#2d6a9f" />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={generalConfig.twoFactorAuth} onChange={() => toggleGeneralConfig('twoFactorAuth')} />
                                            Autenticación de dos factores (2FA)
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#f9fafb', borderRadius: 12 }}>
                                        <Database size={20} color="#2d6a9f" />
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={generalConfig.modoMantenimiento} onChange={() => toggleGeneralConfig('modoMantenimiento')} />
                                            Modo mantenimiento
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'catalogos' && (
                            <div className="responsive-grid">
                                {/* Catálogo de Daños */}
                                <div style={cardStyle}>
                                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Wrench size={20} /> Tipos de Daño
                                    </h3>
                                    <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                                        <input
                                            type="text"
                                            value={newDamage}
                                            onChange={(e) => setNewDamage(e.target.value)}
                                            placeholder="Nuevo tipo de daño..."
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                                        />
                                        <button onClick={addDamageType} style={{ background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {damageTypes.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>No hay tipos de daño registrados</p>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0 }}>
                                            {damageTypes.map(damage => (
                                                <li key={damage.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e4e7eb' }}>
                                                    <span>
                                                        <strong>{damage.name}</strong>
                                                        {damage.code && <small style={{ color: '#6b7280', marginLeft: 8 }}>({damage.code})</small>}
                                                        {damage.description && <small style={{ color: '#9ca3af', marginLeft: 8, fontSize: 11 }}>{damage.description}</small>}
                                                    </span>
                                                    <button onClick={() => deleteDamageType(damage.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Catálogo de Servicios */}
                                <div style={cardStyle}>
                                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FileText size={20} /> Tipos de Servicio
                                    </h3>
                                    <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                                        <input
                                            type="text"
                                            value={newService}
                                            onChange={(e) => setNewService(e.target.value)}
                                            placeholder="Nuevo tipo de servicio..."
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                                        />
                                        <button onClick={addServiceType} style={{ background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {serviceTypes.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>No hay tipos de servicio registrados</p>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0 }}>
                                            {serviceTypes.map(service => (
                                                <li key={service.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e4e7eb' }}>
                                                    <span>
                                                        <strong>{service.name}</strong>
                                                        {service.category && <small style={{ color: '#6b7280', marginLeft: 8 }}>({service.category})</small>}
                                                        {service.description && <small style={{ color: '#9ca3af', marginLeft: 8, fontSize: 11 }}>{service.description}</small>}
                                                    </span>
                                                    <button onClick={() => deleteServiceType(service.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB: Formato Ticket */}
                        {activeTab === 'ticket' && (
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Formato automático de tickets</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Prefijo</label>
                                        <input
                                            type="text"
                                            value={ticketFormat.prefix}
                                            onChange={(e) => setTicketFormat({ ...ticketFormat, prefix: e.target.value })}
                                            placeholder="Ej: UTA-, INC-, TKT-"
                                            style={{ width: '200px', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: 20 }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={ticketFormat.includeYear} onChange={(e) => setTicketFormat({ ...ticketFormat, includeYear: e.target.checked })} />
                                            Incluir año (YYYY)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input type="checkbox" checked={ticketFormat.includeMonth} onChange={(e) => setTicketFormat({ ...ticketFormat, includeMonth: e.target.checked })} />
                                            Incluir mes (MM)
                                        </label>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Número de dígitos secuencial</label>
                                        <select
                                            value={ticketFormat.digits}
                                            onChange={(e) => setTicketFormat({ ...ticketFormat, digits: parseInt(e.target.value) })}
                                            style={{ width: '150px', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db' }}
                                        >
                                            <option value={4}>4 (0001)</option>
                                            <option value={5}>5 (00001)</option>
                                            <option value={6}>6 (000001)</option>
                                        </select>
                                    </div>
                                    <div style={{ background: '#f3f4f6', padding: 16, borderRadius: 12 }}>
                                        <strong>Ejemplo:</strong> {ticketFormat.prefix}
                                        {ticketFormat.includeYear && new Date().getFullYear()}
                                        {ticketFormat.includeMonth && String(new Date().getMonth() + 1).padStart(2, '0')}
                                        {String(1).padStart(ticketFormat.digits, '0')}
                                        <small style={{ display: 'block', color: '#6b7280', marginTop: 8 }}>
                                            Formato aplicado automáticamente al crear tickets
                                        </small>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botón Guardar Global */}
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e4e7eb', paddingTop: 24 }}>
                            <button
                                onClick={handleSaveAll}
                                disabled={saving}
                                style={{
                                    background: '#2d6a9f',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 32px',
                                    borderRadius: 12,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                {saving ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                {saving ? 'Guardando configuración...' : 'Guardar todos los cambios'}
                            </button>
                        </div>
                    </>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </Layout>
    );
}

export default SystemConfig;