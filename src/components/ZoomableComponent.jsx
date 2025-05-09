// ... existing code ...

// Modify your drag handler to account for zoom level with adaptive speed
const handleDrag = (e) => {
  // Assuming you have a zoom level state variable
  const zoomCompensation = currentZoomLevel;
  
  // Dynamic dampening factor based on zoom level
  let dampening = 1.7; // Default dampening
  
  // Progressive speed increase as we approach max zoom
  if (currentZoomLevel > 1.5) {
    // Progressively increase speed as zoom increases
    dampening = 1.3; // Base increase
  }
  
  // Additional speed boost when very close to max zoom (assuming max is 1.0)
  if (currentZoomLevel > 0.8 && currentZoomLevel <= 1.0) {
    dampening = 2.0; // Much faster movement when at max zoom
  }
  
  // Apply zoom compensation to movement with dampening
  const deltaX = e.movementX * zoomCompensation * dampening;
  const deltaY = e.movementY * zoomCompensation * dampening;
  
  // Update position with compensated movement
  setPosition({
    x: position.x + deltaX,
    y: position.y + deltaY
  });
};

// Improved zoom limit function with better constraints
const handleZoom = (delta) => {
  // Calculate new zoom level
  const newZoomLevel = currentZoomLevel + delta;
  
  // Set minimum and maximum zoom levels
  const minZoomLevel = 40.0; // Prevent zooming out too far
  const maxZoomLevel = 1.0; // Strict limit on how far user can zoom in
  
  // Apply zoom with strict limits
  if (newZoomLevel >= minZoomLevel && newZoomLevel <= maxZoomLevel) {
    setCurrentZoomLevel(newZoomLevel);
  } else if (newZoomLevel > maxZoomLevel) {
    // If trying to zoom beyond max, set exactly to max
    setCurrentZoomLevel(maxZoomLevel);
  } else if (newZoomLevel < minZoomLevel) {
    // If trying to zoom out beyond min, set exactly to min
    setCurrentZoomLevel(minZoomLevel);
  }
};

// ... existing code ...