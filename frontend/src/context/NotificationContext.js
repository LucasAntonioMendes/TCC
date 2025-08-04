import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [message, setMessage] = useState(null);
    const [type, setType] = useState("info");

    const showNotification = (msg, tipo = "info") => {
        setMessage(msg);
        setType(tipo);

        setTimeout(() => setMessage(null), 5000);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {message && (
                <div className={`notification ${type}`}>
                    {message}
                </div>
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
