import React from 'react';

const NotificationBanner = ({ notification }) => {
    if (!notification) return null;
    
    const isSuccess = notification.type === 'success';
    
    const style = {
        padding: '15px', 
        marginBottom: '20px', 
        borderRadius: '8px', 
        textAlign: 'center', 
        fontWeight: '600',
        backgroundColor: isSuccess ? 'var(--success-bg)' : 'var(--error-bg)',
        color: isSuccess ? 'var(--success-text)' : 'var(--error-text)',
        border: `1px solid ${isSuccess ? 'var(--success-border)' : 'var(--error-border)'}`, 
        animation: 'fadeIn 0.3s ease'
    };

    return <div style={style}>{notification.message}</div>
}

export default NotificationBanner;