// Fake Carrier Service to simulate third-party logistics tracking, updates, and delivery confirmation

export const generateTrackingNumber = (courier = "FloData Express") => {
    const prefixMap = {
        "FloData Express": "FDX",
        "BlueDart": "BLU",
        "Delhivery": "DLV",
        "FedEx": "FDX",
        "DTDC": "DTC",
    };

    const prefix = prefixMap[courier] || "TRK";
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    return `${prefix}-${randomDigits}`;
};

export const createInitialCarrierEvents = (courier, originCity = "Mumbai", destinationCity = "Delhi") => {
    const now = new Date();
    return [
        {
            status: "manifest_created",
            location: `${originCity} Central Hub`,
            timestamp: now,
            description: `Electronic shipping info received by ${courier}. Manifest created.`,
        },
        {
            status: "picked_up",
            location: `${originCity} Warehouse Dock`,
            timestamp: new Date(now.getTime() + 15 * 60000),
            description: `Package picked up by ${courier} ground fleet.`,
        },
        {
            status: "in_transit",
            location: `${originCity} Sorting Center`,
            timestamp: new Date(now.getTime() + 60 * 60000),
            description: `Package departed origin sort facility en route to ${destinationCity}.`,
        },
    ];
};

export const getNextCarrierSimulationEvent = (currentStatus, destinationCity = "Customer Destination") => {
    const now = new Date();
    if (currentStatus === "in_transit") {
        return {
            nextStatus: "out_for_delivery",
            event: {
                status: "out_for_delivery",
                location: `${destinationCity} Local Hub`,
                timestamp: now,
                description: "Package is out for delivery with local courier agent.",
            },
        };
    } else if (currentStatus === "out_for_delivery") {
        return {
            nextStatus: "delivered",
            event: {
                status: "delivered",
                location: `${destinationCity} Customer Address`,
                timestamp: now,
                description: "Package delivered. Signed by recipient.",
            },
        };
    }

    return null;
};
