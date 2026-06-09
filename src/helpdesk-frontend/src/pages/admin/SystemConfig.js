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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    const updateTimeConfig = (level, field, value) => {
        setTimeConfigs(prev => prev.map(c =>
            c.level === level ? { ...c, [field]: parseInt(value) || 0 } : c
        ));
    };

    const toggleGeneralConfig = (key) => {
        setGeneralConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const addDamageType = async () => {
        if (!newDamage.trim()) return;
        try {
            const damageData = {
                name: newDamage.trim(),
                code: newDamage.substring(0, 3).toUpperCase(),
                description: `Tipo de daño: ${newDamage.trim()}`
            };
            await catalogAPI.post('/damagecatalog', damageData);
            await loadDamageCatalog();
            setNewDamage('');
            showSuccess('Tipo de daño agregado correctamente');
        } catch (err) {
            console.error('Error al agregar:', err);
            setError(err.response?.data?.message || 'Error al agregar tipo de daño');
        }
    };

    const deleteDamageType = async (id) => {
        if (!window.confirm('¿Eliminar este tipo de daño?')) return;
        try {
            await catalogAPI.delete(`/damagecatalog/${id}`);
            await loadDamageCatalog();
            showSuccess('Tipo de daño eliminado');
        } catch (err) {
            console.error('Error al eliminar:', err);
            setError('Error al eliminar tipo de daño');
        }
    };

    const addServiceType = async () => {
        if (!newService.trim()) return;
        try {
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
            await loadServiceCatalog();
            setNewService('');
            showSuccess('Tipo de servicio agregado correctamente');
        } catch (err) {
            console.error('Error al agregar servicio:', err);
            setError(err.response?.data?.message || 'Error al agregar tipo de servicio');
        }
    };

    const deleteServiceType = async (id) => {
        if (!window.confirm('¿Eliminar este tipo de servicio?')) return;
        try {
            await catalogAPI.delete(`/servicecatalog/${id}`);
            await loadServiceCatalog();
            showSuccess('Tipo de servicio eliminado');
        } catch (err) {
            console.error('Error al eliminar servicio:', err);
            setError('Error al eliminar tipo de servicio');
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await authAPI.put('/configuration/levels', { configs: timeConfigs });
            await authAPI.put('/configuration/general', generalConfig);
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

    const tabs = [
        { id: 'tiempos', label: isMobile ? 'SLA' : ' Tiempos SLA', icon: Clock },
        { id: 'general', label: isMobile ? 'General' : 'General', icon: Settings },
        { id: 'catalogos', label: isMobile ? 'Catálogos' : 'Catálogos', icon: BookOpen },
        { id: 'ticket', label: isMobile ? 'Formato' : 'Formato Ticket', icon: Tag }
    ];

    return (
        <Layout>
            <div className="system-config-page">
                {/* Header */}
                <div className="system-config-header">
                    <div>
                        <h1 className="system-config-title">
                            <Settings size={isMobile ? 24 : 28} />
                            Configuración General
                        </h1>
                        <p className="system-config-subtitle">
                            Gestiona parámetros globales: tiempos SLA, catálogos, formatos y más
                        </p>
                    </div>
                    <button className="system-config-refresh-btn" onClick={loadAllConfigs}>
                        <RefreshCw size={16} />
                        Actualizar
                    </button>
                </div>

                {/* Alertas */}
                {success && (
                    <div className="system-config-success">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}
                {error && (
                    <div className="system-config-error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="system-config-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`system-config-tab ${activeTab === tab.id ? 'system-config-tab-active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={isMobile ? 14 : 16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="system-config-loading">Cargando configuración del sistema...</div>
                ) : (
                    <>
                        {/* TAB: Tiempos SLA */}
                        {activeTab === 'tiempos' && (
                            <div className="system-config-grid">
                                {timeConfigs.map(config => (
                                    <div key={config.level} className="system-config-card">
                                        <div className="system-config-card-header">
                                            <div className={`system-config-level-icon system-config-level-${config.level}`}>
                                                <span>N{config.level}</span>
                                            </div>
                                            <div>
                                                <h3 className="system-config-card-title">{config.levelName}</h3>
                                                <p className="system-config-card-subtitle">Nivel {config.level}</p>
                                            </div>
                                        </div>

                                        <div className="system-config-field">
                                            <label className="system-config-label">
                                                <Clock size={14} />
                                                Tiempo de respuesta (horas)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={168}
                                                className="system-config-input"
                                                value={config.responseHours}
                                                onChange={(e) => updateTimeConfig(config.level, 'responseHours', e.target.value)}
                                            />
                                        </div>

                                        <div className="system-config-field">
                                            <label className="system-config-label">
                                                <Target size={14} />
                                                Tiempo de resolución (horas)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={720}
                                                className="system-config-input"
                                                value={config.resolutionHours}
                                                onChange={(e) => updateTimeConfig(config.level, 'resolutionHours', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TAB: Configuración General */}
                        {activeTab === 'general' && (
                            <div className="system-config-card">
                                <h3 className="system-config-section-title">Parámetros del sistema</h3>
                                <div className="system-config-checkbox-grid">
                                    <div className="system-config-checkbox-item">
                                        <Bell size={20} color="#2d6a9f" />
                                        <label>
                                            <input type="checkbox" checked={generalConfig.notificacionesRealtime} onChange={() => toggleGeneralConfig('notificacionesRealtime')} />
                                            Notificaciones en tiempo real
                                        </label>
                                    </div>
                                    <div className="system-config-checkbox-item">
                                        <Zap size={20} color="#2d6a9f" />
                                        <label>
                                            <input type="checkbox" checked={generalConfig.asignacionAutomatica} onChange={() => toggleGeneralConfig('asignacionAutomatica')} />
                                            Asignación automática
                                        </label>
                                    </div>
                                    <div className="system-config-checkbox-item">
                                        <Mail size={20} color="#2d6a9f" />
                                        <label>
                                            <input type="checkbox" checked={generalConfig.alertasCorreo} onChange={() => toggleGeneralConfig('alertasCorreo')} />
                                            Alertas por correo
                                        </label>
                                    </div>
                                    <div className="system-config-checkbox-item">
                                        <Server size={20} color="#2d6a9f" />
                                        <label>
                                            <input type="checkbox" checked={generalConfig.controlSLA} onChange={() => toggleGeneralConfig('controlSLA')} />
                                            Control de SLA
                                        </label>
                                    </div>
                                    <div className="system-config-checkbox-item">
                                        <Shield size={20} color="#2d6a9f" />
                                        <label>
                                            <input type="checkbox" checked={generalConfig.twoFactorAuth} onChange={() => toggleGeneralConfig('twoFactorAuth')} />
                                            Autenticación de dos factores (2FA)
                                        </label>
                                    </div>
                                    <div className="system-config-checkbox-item">
                                        <Database size={20} color="#2d6a9f" />
                                        <label>
                                            <input type="checkbox" checked={generalConfig.modoMantenimiento} onChange={() => toggleGeneralConfig('modoMantenimiento')} />
                                            Modo mantenimiento
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: Catálogos */}
                        {activeTab === 'catalogos' && (
                            <div className="system-config-catalog-grid">
                                {/* Catálogo de Daños */}
                                <div className="system-config-card">
                                    <h3 className="system-config-section-title">
                                        <Wrench size={20} /> Tipos de Daño
                                    </h3>
                                    <div className="system-config-add-form">
                                        <input
                                            type="text"
                                            value={newDamage}
                                            onChange={(e) => setNewDamage(e.target.value)}
                                            placeholder="Nuevo tipo de daño..."
                                            className="system-config-input"
                                        />
                                        <button onClick={addDamageType} className="system-config-add-btn">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {damageTypes.length === 0 ? (
                                        <p className="system-config-empty">No hay tipos de daño registrados</p>
                                    ) : (
                                        <ul className="system-config-list">
                                            {damageTypes.map(damage => (
                                                <li key={damage.id} className="system-config-list-item">
                                                    <span>
                                                        <strong>{damage.name}</strong>
                                                        {damage.code && <small>({damage.code})</small>}
                                                        {damage.description && <small className="system-config-desc">{damage.description}</small>}
                                                    </span>
                                                    <button onClick={() => deleteDamageType(damage.id)} className="system-config-delete-btn">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Catálogo de Servicios */}
                                <div className="system-config-card">
                                    <h3 className="system-config-section-title">
                                        <FileText size={20} /> Tipos de Servicio
                                    </h3>
                                    <div className="system-config-add-form">
                                        <input
                                            type="text"
                                            value={newService}
                                            onChange={(e) => setNewService(e.target.value)}
                                            placeholder="Nuevo tipo de servicio..."
                                            className="system-config-input"
                                        />
                                        <button onClick={addServiceType} className="system-config-add-btn">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    {serviceTypes.length === 0 ? (
                                        <p className="system-config-empty">No hay tipos de servicio registrados</p>
                                    ) : (
                                        <ul className="system-config-list">
                                            {serviceTypes.map(service => (
                                                <li key={service.id} className="system-config-list-item">
                                                    <span>
                                                        <strong>{service.name}</strong>
                                                        {service.category && <small>({service.category})</small>}
                                                        {service.description && <small className="system-config-desc">{service.description}</small>}
                                                    </span>
                                                    <button onClick={() => deleteServiceType(service.id)} className="system-config-delete-btn">
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
                            <div className="system-config-card">
                                <h3 className="system-config-section-title">Formato automático de tickets</h3>
                                <div className="system-config-ticket-form">
                                    <div className="system-config-field">
                                        <label className="system-config-label">Prefijo</label>
                                        <input
                                            type="text"
                                            value={ticketFormat.prefix}
                                            onChange={(e) => setTicketFormat({ ...ticketFormat, prefix: e.target.value })}
                                            placeholder="Ej: UTA-, INC-, TKT-"
                                            className="system-config-input"
                                        />
                                    </div>
                                    <div className="system-config-checkbox-row">
                                        <label>
                                            <input type="checkbox" checked={ticketFormat.includeYear} onChange={(e) => setTicketFormat({ ...ticketFormat, includeYear: e.target.checked })} />
                                            Incluir año (YYYY)
                                        </label>
                                        <label>
                                            <input type="checkbox" checked={ticketFormat.includeMonth} onChange={(e) => setTicketFormat({ ...ticketFormat, includeMonth: e.target.checked })} />
                                            Incluir mes (MM)
                                        </label>
                                    </div>
                                    <div className="system-config-field">
                                        <label className="system-config-label">Número de dígitos secuencial</label>
                                        <select
                                            value={ticketFormat.digits}
                                            onChange={(e) => setTicketFormat({ ...ticketFormat, digits: parseInt(e.target.value) })}
                                            className="system-config-select"
                                        >
                                            <option value={4}>4 (0001)</option>
                                            <option value={5}>5 (00001)</option>
                                            <option value={6}>6 (000001)</option>
                                        </select>
                                    </div>
                                    <div className="system-config-example">
                                        <strong>Ejemplo:</strong> {ticketFormat.prefix}
                                        {ticketFormat.includeYear && new Date().getFullYear()}
                                        {ticketFormat.includeMonth && String(new Date().getMonth() + 1).padStart(2, '0')}
                                        {String(1).padStart(ticketFormat.digits, '0')}
                                        <small>Formato aplicado automáticamente al crear tickets</small>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botón Guardar Global */}
                        <div className="system-config-footer">
                            <button onClick={handleSaveAll} disabled={saving} className="system-config-save-btn">
                                {saving ? <RefreshCw size={16} className="system-config-spinner" /> : <Save size={16} />}
                                {saving ? 'Guardando...' : 'Guardar todos los cambios'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .system-config-page {
                    padding: 28px 32px;
                    background-color: #f5f7fa;
                    min-height: 100vh;
                }

                .system-config-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .system-config-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1a1a2e;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .system-config-subtitle {
                    font-size: 13px;
                    color: #6b7280;
                    margin-top: 8px;
                }

                .system-config-refresh-btn {
                    background: #fff;
                    border: 1px solid #d1d5db;
                    border-radius: 12px;
                    padding: 10px 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    font-weight: 600;
                }

                .system-config-success {
                    background-color: #ecfdf5;
                    color: #10b981;
                    padding: 14px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .system-config-error {
                    background-color: #fef2f2;
                    color: #dc2626;
                    padding: 14px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .system-config-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    border-bottom: 1px solid #e4e7eb;
                    flex-wrap: wrap;
                }

                .system-config-tab {
                    padding: 12px 24px;
                    background: transparent;
                    color: #6b7280;
                    border: none;
                    border-radius: 12px 12px 0 0;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .system-config-tab-active {
                    background: #2d6a9f;
                    color: #fff;
                }

                .system-config-loading {
                    text-align: center;
                    padding: 60px;
                }

                .system-config-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }

                .system-config-card {
                    background: #fff;
                    border-radius: 20px;
                    border: 1px solid #e4e7eb;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                    margin-bottom: 24px;
                }

                .system-config-card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .system-config-level-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 700;
                    color: #2d6a9f;
                }

                .system-config-level-1 { background: #eef2ff; }
                .system-config-level-2 { background: #ecfdf5; }
                .system-config-level-3 { background: #fffbeb; }

                .system-config-card-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a1a2e;
                    margin: 0;
                }

                .system-config-card-subtitle {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 2px;
                }

                .system-config-field {
                    margin-bottom: 16px;
                }

                .system-config-field:last-child {
                    margin-bottom: 0;
                }

                .system-config-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                }

                .system-config-input {
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: 10px;
                    border: 1px solid #d1d5db;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                .system-config-input:focus {
                    border-color: #2d6a9f;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(45, 106, 159, 0.1);
                }

                .system-config-select {
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: 10px;
                    border: 1px solid #d1d5db;
                    font-size: 14px;
                    background: #fff;
                }

                .system-config-section-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .system-config-checkbox-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }

                .system-config-checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #f9fafb;
                    border-radius: 12px;
                    flex-wrap: wrap;
                }

                .system-config-checkbox-item label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                }

                .system-config-checkbox-row {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .system-config-catalog-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                }

                .system-config-add-form {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                }

                .system-config-add-btn {
                    background: #2d6a9f;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .system-config-add-btn:hover {
                    background: #1e4a76;
                }

                .system-config-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .system-config-list-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid #e4e7eb;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .system-config-desc {
                    color: #9ca3af;
                    margin-left: 8px;
                    font-size: 11px;
                }

                .system-config-delete-btn {
                    background: none;
                    border: none;
                    color: #dc2626;
                    cursor: pointer;
                    padding: 4px;
                }

                .system-config-delete-btn:hover {
                    background: #fee2e2;
                    border-radius: 6px;
                }

                .system-config-empty {
                    text-align: center;
                    color: #6b7280;
                    padding: 20px;
                }

                .system-config-ticket-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .system-config-example {
                    background: #f3f4f6;
                    padding: 16px;
                    border-radius: 12px;
                }

                .system-config-example small {
                    display: block;
                    color: #6b7280;
                    margin-top: 8px;
                }

                .system-config-footer {
                    margin-top: 24px;
                    display: flex;
                    justify-content: flex-end;
                    border-top: 1px solid #e4e7eb;
                    padding-top: 24px;
                }

                .system-config-save-btn {
                    background: #2d6a9f;
                    color: #fff;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .system-config-save-btn:hover {
                    background: #1e4a76;
                    transform: translateY(-1px);
                }

                .system-config-save-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .system-config-spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .system-config-page {
                        padding: 70px 12px 20px 12px;
                    }

                    .system-config-title {
                        font-size: 22px;
                    }

                    .system-config-subtitle {
                        font-size: 11px;
                    }

                    .system-config-tab {
                        padding: 8px 12px;
                        font-size: 12px;
                    }

                    .system-config-grid {
                        grid-template-columns: 1fr;
                    }

                    .system-config-checkbox-grid {
                        grid-template-columns: 1fr;
                    }

                    .system-config-catalog-grid {
                        grid-template-columns: 1fr;
                    }

                    .system-config-footer {
                        justify-content: center;
                    }

                    .system-config-save-btn {
                        width: 100%;
                        justify-content: center;
                        padding: 12px 20px;
                    }

                    .system-config-card {
                        padding: 16px;
                    }

                    .system-config-card-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .system-config-section-title {
                        font-size: 16px;
                    }

                    .system-config-checkbox-item {
                        flex-direction: column;
                        text-align: center;
                    }

                    .system-config-checkbox-row {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .system-config-add-form {
                        flex-direction: column;
                    }

                    .system-config-add-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </Layout>
    );
}

export default SystemConfig;