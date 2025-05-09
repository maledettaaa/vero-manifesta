import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { MapControls, Plane, useTexture, Text } from "@react-three/drei";
import * as THREE from 'three';
import imagesData from '../Service/images.json';
import { useState, useCallback, useEffect, Suspense, useMemo, useRef } from 'react';
import imageDescriptions from '../Service/imageDescriptions.json';

// Helper function to create a rounded rectangle texture
const createRoundedRectTexture = (width, height, radius) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas with a transparent background
  ctx.clearRect(0, 0, width, height);
  
  // Draw a rounded rectangle
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  
  // Fill with white
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Create a texture from the canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
};

// Component to render a single image plane with error handling
function ImagePlane({ path, position, id, onClick }) {
  // Always call hooks at the top level, not conditionally
  const texture = useTexture(path);

  // Handle errors with state instead of try/catch around hooks
  const [hasError, setHasError] = useState(false);
  
  // Use useEffect to handle texture loading errors
  useEffect(() => {
    const handleError = () => {
      console.error(`Error loading texture for image ${id}: ${path}`);
      setHasError(true);
    };
    
    // Add error event listener to texture
    if (texture && texture.source) {
      const source = texture.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [texture, id, path]);

  // Get the natural dimensions of the loaded texture
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  
  // Use useEffect to get the natural dimensions once texture is loaded
  useEffect(() => {
    if (texture && texture.image) {
      const aspectRatio = texture.image.width / texture.image.height;
      // Keep a reasonable size in the 3D space while maintaining aspect ratio
      const maxDimension = 1.5; // Maximum size in any dimension
      let width, height;
      
      if (aspectRatio > 1) {
        // Landscape image
        width = Math.min(maxDimension, aspectRatio);
        height = width / aspectRatio;
      } else {
        // Portrait image
        height = Math.min(maxDimension, 1 / aspectRatio);
        width = height * aspectRatio;
      }
      
      setDimensions({ width, height });
    }
  }, [texture]);

  return (
    <Plane 
      args={[dimensions.width, dimensions.height]} 
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(id, path, position);
      }}
    > 
      <meshStandardMaterial 
        map={hasError ? null : texture} 
        color={hasError ? "#ff6b9d" : "#ffffff"}
        side={THREE.DoubleSide} 
      /> 
    </Plane>
  );
}

// Info window component that appears next to an image
function InfoWindow({ image, position }) {
  console.log("Rendering InfoWindow with:", { image, position });
  
  // Load info icon with error handling
  const [hasIconError, setHasIconError] = useState(false);
  const infoIcon = useTexture('/assets/icons/info.png');
  
  // Add error handling for icon loading
  useEffect(() => {
    const handleError = () => {
      console.error('Error loading info icon');
      setHasIconError(true);
    };
    
    if (infoIcon && infoIcon.source) {
      const source = infoIcon.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [infoIcon]);
  
  // Get the full image data from imagesData
  const imageData = imagesData.find(img => img.id === image.id) || {};
  
  return (
    <group position={[position[0] + 1.5, position[1], position[2] + 0.1]}>
      {/* Info window background */}
      <Plane args={[2, 1.5]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </Plane>
      
      {/* Info icon in the corner */}
      <Plane args={[0.4, 0.4]} position={[-0.7, 0.5, 0.01]}>
        <meshBasicMaterial 
          map={hasIconError ? null : infoIcon} 
          color={hasIconError ? "#ff6b9d" : "#ffffff"}
          transparent 
          opacity={0.9} 
        />
      </Plane>
      
      {/* Title text */}
      <Text 
        position={[0, 0.5, 0.01]}
        fontSize={0.15}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {imageData.title || "Untitled"}
      </Text>
      
      {/* Description text */}
      <Text 
        position={[0, 0.2, 0.01]}
        fontSize={0.1}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {imageData.description || "No description available"}
      </Text>
      
      {/* Details text */}
      <Text 
        position={[0, -0.2, 0.01]}
        fontSize={0.08}
        color="#555555"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
        overflowWrap="break-word"
      >
        {imageData.details || "No additional details available"}
      </Text>
    </group>
  );
}

// Enhanced zoomed image view with error handling
function ZoomedImageView({ imagePath, onClose, onNext, onPrevious }) {
  const texture = useTexture(imagePath);
  const [hasError, setHasError] = useState(false);
  const { size } = useThree();
  
  // Load navigation icons with error handling
  const [hasIconError, setHasIconError] = useState(false);
  const prevIcon = useTexture('/assets/icons/left-arrow.png');
  const nextIcon = useTexture('/assets/icons/right-arrow.png');
  const closeIcon = useTexture('/assets/icons/close.png');
  
  // Add error handling for icon loading
  useEffect(() => {
    const handleError = () => {
      console.error('Error loading navigation icons');
      setHasIconError(true);
    };
    
    const icons = [prevIcon, nextIcon, closeIcon];
    
    icons.forEach(icon => {
      if (icon && icon.source && icon.source.data) {
        icon.source.data.addEventListener('error', handleError);
      }
    });
    
    return () => {
      icons.forEach(icon => {
        if (icon && icon.source && icon.source.data) {
          icon.source.data.removeEventListener('error', handleError);
        }
      });
    };
  }, [prevIcon, nextIcon, closeIcon]);
  
  // Remove camera manipulation
  const imageAspect = texture && texture.image ? texture.image.width / texture.image.height : 1;
  const viewportAspect = size.width / size.height;
  
  let width, height;
  if (imageAspect > viewportAspect) {
    width = 8; // Fixed width
    height = width / imageAspect;
  } else {
    height = 8; // Fixed height
    width = height * imageAspect;
  }

  return (
    <group>
      {/* Semi-transparent background */}
      <Plane 
        args={[size.width / 50, size.height / 50]} 
        position={[0, 0, -0.1]}
        onClick={onClose}
      >
        <meshBasicMaterial color="#000000" transparent opacity={0.85} />
      </Plane>
      
      {/* Image with frame */}
      <group>
        {/* Frame */}
        <Plane 
          args={[width + 0.1, height + 0.1]} 
          position={[0, 0, -0.01]}
        >
          <meshBasicMaterial color="#ffffff" />
        </Plane>
        
        {/* Image */}
        <Plane args={[width, height]} position={[0, 0, 0]}>
          <meshBasicMaterial 
            map={hasError ? null : texture} 
            color={hasError ? "#ff6b9d" : "#ffffff"}
            transparent 
          />
        </Plane>
      </group>
      
      {/* Navigation controls with icons */}
      <group position={[0, -height/2 - 0.8, 0]}>
        {/* Previous button */}
        <Plane 
          args={[0.6, 0.6]}
          position={[-2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : prevIcon} 
            color="#ff6b9d" 
            transparent
          />
        </Plane>
        
        {/* Next button */}
        <Plane 
          args={[0.6, 0.6]}
          position={[2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : nextIcon} 
            color="#ff6b9d" 
            transparent
          />
        </Plane>
        
        {/* Close button */}
        <Plane 
          args={[0.6, 0.6]}
          position={[0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <meshBasicMaterial 
            map={hasIconError ? null : closeIcon} 
            color="#ffffff" 
            transparent
          />
        </Plane>
      </group>
    </group>
  );
}

// Create a component that renders a fixed overlay using HTML and CSS
// In the FixedImagePopup component
function FixedImagePopup({ image, onClose, onNext, onPrevious }) {
  const [hasError, setHasError] = useState(false);
  const texture = useTexture(image.path);
  
  // Get description from imageDescriptions.json
  const description = imageDescriptions[image.path] || "No description available.";
  
  // Add error handling for texture loading
  useEffect(() => {
    const handleError = () => {
      console.error(`Error loading texture for popup image: ${image.path}`);
      setHasError(true);
    };
    
    if (texture && texture.source) {
      const source = texture.source;
      if (source.data) {
        source.data.addEventListener('error', handleError);
        return () => {
          source.data.removeEventListener('error', handleError);
        };
      }
    }
  }, [texture, image.path]);
  
  // Use useFrame to ensure the popup is always in front of the camera
  const popupRef = useRef();
  const [popupScale, setPopupScale] = useState(0.7); // Start smaller

  // Animate the popup scale when it appears
  useEffect(() => {
    let animationFrame;
    let scale = 0.7;
    const animate = () => {
      scale += (1 - scale) * 0.15; // Easing
      setPopupScale(scale);
      if (Math.abs(scale - 1) > 0.01) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setPopupScale(1);
      }
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [image]);

  useFrame(({ camera }) => {
    if (popupRef.current) {
      popupRef.current.position.copy(camera.position);
      popupRef.current.position.z -= 5;
      popupRef.current.quaternion.copy(camera.quaternion);
      popupRef.current.scale.set(popupScale, popupScale, popupScale); // Apply scale
    }
  });
  
  // Calculate image aspect ratio
  const imageAspect = texture && texture.image ? texture.image.width / texture.image.height : 1;
  
  // Fixed card dimensions
  const cardWidth = 10;
  const cardHeight = 7;  // Reduced from 8 to 7 for a less tall appearance
  
  // Fixed image container dimensions
  const imageContainerWidth = 5;
  const imageContainerHeight = 4.5;  // Adjusted to match the new card height
  
  // Calculate image dimensions to fit within container while preserving aspect ratio
  let imageWidth, imageHeight;
  if (imageAspect >= 1) {
    // Landscape image
    imageWidth = imageContainerWidth;
    imageHeight = imageWidth / imageAspect;
    
    // If height exceeds container, scale down
    if (imageHeight > imageContainerHeight) {
      imageHeight = imageContainerHeight;
      imageWidth = imageHeight * imageAspect;
    }
  } else {
    // Portrait image
    imageHeight = imageContainerHeight;
    imageWidth = imageHeight * imageAspect;
    
    // If width exceeds container, scale down
    if (imageWidth > imageContainerWidth) {
      imageWidth = imageContainerWidth;
      imageHeight = imageWidth / imageAspect;
    }
  }
  
  // Fixed text box dimensions
  const textBoxWidth = 3.2;
  const textBoxHeight = 4.5;  // Adjusted to match the new card height
  
  // Define rounded corners parameters
  const cornerRadius = 0.2; // Adjust this value to control the roundness
  
  // Create rounded rectangle textures for masking
  const imageRoundedMask = useMemo(() => 
    createRoundedRectTexture(imageWidth * 100, imageHeight * 100, cornerRadius * 100)
  , [imageWidth, imageHeight, cornerRadius]);
  
  const textBoxRoundedMask = useMemo(() => 
    createRoundedRectTexture(textBoxWidth * 100, textBoxHeight * 100, cornerRadius * 100)
  , [textBoxWidth, textBoxHeight, cornerRadius]);
  
  return (
    <group ref={popupRef} renderOrder={1000}>
      {/* Semi-transparent background */}
      <Plane 
        args={[30, 30]} 
        position={[0, 0, -1]}
        onClick={onClose}
      >
        <meshBasicMaterial color="#000000" transparent opacity={0.0} depthTest={false} />
      </Plane>
      
      {/* Card container */}
      <group position={[0, 0, 0]}>
        {/* Main card */}
        <Plane 
          args={[cardWidth, cardHeight]} 
          position={[0, 0, 0]}
        >
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </Plane>
        
        {/* Image container - fixed position and size */}
        <group position={[-2, 0.3, 0.01]}>  {/* Moved from [-2, 0, 0.01] to [-2, 0.3, 0.01] */}
          {/* Image with rounded corners */}
          <Plane 
            args={[imageWidth, imageHeight]} 
            position={[0, 0, 0]}
          >
            <meshBasicMaterial 
              map={hasError ? null : texture} 
              transparent 
              depthTest={false}
              color={hasError ? "#ff6b9d" : "#ffffff"}
              alphaMap={imageRoundedMask}
              alphaTest={0.5}
            />
          </Plane>
        </group>
        
        {/* Description box - adjusted position slightly up and to the right */}
        <group position={[2.5, 0.3, 0.01]}>
          <Plane
            args={[textBoxWidth, textBoxHeight]}
            position={[0, 0, 0]}
          >
            <meshBasicMaterial 
              color="#333333" 
              transparent 
              opacity={0.7} 
              depthTest={false}
              alphaMap={textBoxRoundedMask}
              alphaTest={0.5}
            />
          </Plane>
          
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.18}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={textBoxWidth - 0.4}
            depthTest={false}
            textAlign="center"
          >
            {description}
          </Text>
        </group>
        
        {/* Navigation buttons - fixed position */}
        <group position={[3.5, -cardHeight/2 + 1, 0]}>
          <Plane args={[1.2, 0.5]} position={[-0.7, 0, 0]} onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}>
            <meshBasicMaterial color="#eeeeee" transparent opacity={0.9} depthTest={false} />
          </Plane>
          <Text
            position={[-0.7, 0, 0.01]}
            fontSize={0.15}
            color="#222222"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
          >
            &lt; Previous
          </Text>
          
          <Plane args={[1.2, 0.5]} position={[0.7, 0, 0]} onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}>
            <meshBasicMaterial color="#eeeeee" transparent opacity={0.9} depthTest={false} />
          </Plane>
          <Text
            position={[0.7, 0, 0.01]}
            fontSize={0.15}
            color="#222222"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
          >
            Next &gt;
          </Text>
        </group>
        
        {/* Close button (X) */}
        <group position={[cardWidth/2 - 0.5, cardHeight/2 - 0.5, 0.02]}>
          <Plane args={[0.5, 0.5]} position={[0, 0, 0]} onClick={onClose}>
            <meshBasicMaterial color="#ff5555" transparent opacity={0.9} depthTest={false} />
          </Plane>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
          >
            X
          </Text>
        </group>
      </group>
    </group>
  );
}

function Experience() {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');
  const planePositions = useMemo(() => 
    imagesData.map(image => image.position || [0, 0, 0])
  , []);
  
  // Add a ref to store the camera controls
  const controlsRef = useRef();

  const handleImageClick = useCallback((id, path, position) => {
    const index = imagesData.findIndex(img => img.id === id);
    setSelectedImageIndex(index);
    setShowPopup(true);
    setPopupText(''); // Or load saved text for this image if you want
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  const handleNext = useCallback(() => {
    setSelectedImageIndex((prev) => (prev + 1) % imagesData.length);
    setPopupText('');
  }, []);

  const handlePrevious = useCallback(() => {
    setSelectedImageIndex((prev) => (prev - 1 + imagesData.length) % imagesData.length);
    setPopupText('');
  }, []);
  
  // Add keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle arrow keys when popup is not shown
      if (showPopup) return;
      
      const moveDistance = 1.0; // Adjust this value to control movement speed
      
      // Check if controls exist before attempting to use them
      if (!controlsRef.current) return;
      
      switch (event.key) {
        case 'ArrowUp':
          controlsRef.current.target.y += moveDistance;
          controlsRef.current.update();
          break;
        case 'ArrowDown':
          controlsRef.current.target.y -= moveDistance;
          controlsRef.current.update();
          break;
        case 'ArrowLeft':
          controlsRef.current.target.x -= moveDistance;
          controlsRef.current.update();
          break;
        case 'ArrowRight':
          controlsRef.current.target.x += moveDistance;
          controlsRef.current.update();
          break;
        default:
          break;
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPopup]);

  return (
    <Canvas camera={{ fov: 75, position: [0, 0, 10] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <Suspense fallback={null}>
        <MapControls 
          ref={controlsRef}
          enabled={!showPopup} 
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE  // Restored to original ROTATE
          }}
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={true}
        />
        
        {/* Image Grid */}
        <group renderOrder={100}>
          {imagesData.map((image, index) => (
            <group key={image.id}>
              <ImagePlane
                id={image.id}
                path={image.path}
                position={planePositions[index]}
                onClick={handleImageClick}
              />
            </group>
          ))}
        </group>
        
        {/* Use the fixed popup component */}
        {showPopup && selectedImageIndex !== null && (
          <FixedImagePopup
            image={imagesData[selectedImageIndex]}
            onClose={handleClosePopup}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}
      </Suspense>
    </Canvas>
  );
}

export default Experience;