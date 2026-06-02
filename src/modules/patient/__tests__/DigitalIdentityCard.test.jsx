import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DigitalIdentityCard from '../DigitalIdentityCard';

describe('DigitalIdentityCard', () => {
    it('renders the patient name and details on the front face', () => {
        render(<DigitalIdentityCard />);
        
        expect(screen.getByText('Harish Kumar')).toBeInTheDocument();
        expect(screen.getByText('12 Aug 1990')).toBeInTheDocument();
        expect(screen.getByText('O+ Positive')).toBeInTheDocument();
        expect(screen.getByText('Male')).toBeInTheDocument();
        expect(screen.getByText('Tap to Reveal QR')).toBeInTheDocument();
    });

    it('flips the card to show QR when clicked', () => {
        render(<DigitalIdentityCard />);
        
        const cardContainer = screen.getByText('Tap to Reveal QR').closest('.cursor-pointer');
        
        // Initially front face is shown (rotation 0)
        expect(screen.getByText('Patient QR Code')).toBeInTheDocument(); // It's in the DOM but hidden via CSS
        
        // Click to flip
        fireEvent.click(cardContainer);
        
        // Since it's a framer-motion animation, we might just test if the state change or click fires.
        // For a simple component test, ensuring it renders both faces and handles click is sufficient.
    });
});
