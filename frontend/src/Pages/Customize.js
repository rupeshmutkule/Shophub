import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Canvas, IText, Image as FabricImage } from "fabric";
import API_BASE_URL from "../config/api";

const FAKESTORE_URL = "https://fakestoreapi.com/products";
// Canvas covers full T-shirt so user can place on sleeves too
const CANVAS_W = 520;
const CANVAS_H = 620;

function Customize({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [frontDesignUrl, setFrontDesignUrl] = useState(null);
  const [backDesignUrl, setBackDesignUrl] = useState(null);
  const [showBothDesigns, setShowBothDesigns] = useState(false);
  const [bothDesignsIndex, setBothDesignsIndex] = useState(0);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [pendingAddType, setPendingAddType] = useState(null); // 'customized', 'skip', or 'buyNow'
  const [frontCanvasState, setFrontCanvasState] = useState(null); // Store front canvas JSON
  const [backCanvasState, setBackCanvasState] = useState(null); // Store back canvas JSON

  // Get product images
  const getProductImages = () => {
    if (!product) return [];
    
    // Handle MongoDB products with images array
    if (product.images && product.images.length > 0) {
      return product.images.map(img => typeof img === 'string' ? img : img.url);
    }
    
    // Fallback to single image
    const singleImage = product.photo || product.image;
    return singleImage ? [singleImage] : [];
  };

  const productImages = getProductImages();
  const currentImage = productImages[currentImageIndex] || product?.image || product?.photo;

  useEffect(() => {
    if (product) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Try MongoDB first
        try {
          const mongoRes = await fetch(`${API_BASE_URL}/api/products/${id}`);
          if (mongoRes.ok) {
            const p = await mongoRes.json();
            if (!cancelled) {
              setProduct(p);
              return;
            }
          }
        } catch (e) {
          // Fallback to FakeStore
        }

        // Fallback to FakeStore API
        const res = await fetch(`${FAKESTORE_URL}/${id}`);
        const p = await res.json();
        if (!cancelled) setProduct(p);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, product]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new Canvas(canvasRef.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      backgroundColor: "transparent",
      selection: true,
    });
    fabricRef.current = canvas;

    // Add event listeners for object selection
    canvas.on('object:added', () => canvas.renderAll());
    canvas.on('object:modified', () => canvas.renderAll());
    canvas.on('selection:created', () => canvas.renderAll());
    canvas.on('selection:updated', () => canvas.renderAll());
    canvas.on('selection:cleared', () => canvas.renderAll());

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  const handleAddText = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText("Your Text", {
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      originX: "center",
      originY: "center",
      fill: "#111827",
      fontSize: 28,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Convert file to base64 to avoid blob URL issues
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Url = event.target.result;
        const img = await FabricImage.fromURL(base64Url, { crossOrigin: "anonymous" });

        // Center it and scale to fit
        img.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          originX: "center",
          originY: "center",
          selectable: true,
        });
        img.scaleToWidth(canvas.getWidth() * 0.35);

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      } catch (err) {
        console.error('Error loading image:', err);
        alert('Failed to load image. Please try again.');
      }
    };
    reader.readAsDataURL(file);
    
    // Allow uploading same file again
    e.target.value = "";
  };

  const handleBringToFront = () => {
    // Show front image (index 0)
    if (productImages.length > 0) {
      const canvas = fabricRef.current;
      if (canvas) {
        // Save current canvas state (back side) with base64 images
        if (currentImageIndex > 0) {
          const canvasJSON = canvas.toJSON();
          setBackCanvasState(canvasJSON);
          
          // Check if canvas is empty before clearing saved design
          if (canvas.getObjects().length === 0 && backDesignUrl) {
            setBackDesignUrl(null);
          }
        }
        
        // Clear canvas
        canvas.clear();
        
        // Restore front canvas state if it exists
        if (frontCanvasState) {
          canvas.loadFromJSON(frontCanvasState, () => {
            canvas.renderAll();
          }, (o, object) => {
            // Revive function - handle image loading errors
            if (object.type === 'image' && object.src && object.src.startsWith('blob:')) {
              console.warn('Skipping blob URL image:', object.src);
            }
          });
        }
      }
      setCurrentImageIndex(0);
    }
  };

  const handleSendToBack = () => {
    // Show back image (last index)
    if (productImages.length > 1) {
      const canvas = fabricRef.current;
      if (canvas) {
        // Save current canvas state (front side) with base64 images
        if (currentImageIndex === 0) {
          const canvasJSON = canvas.toJSON();
          setFrontCanvasState(canvasJSON);
          
          // Check if canvas is empty before clearing saved design
          if (canvas.getObjects().length === 0 && frontDesignUrl) {
            setFrontDesignUrl(null);
          }
        }
        
        // Clear canvas
        canvas.clear();
        
        // Restore back canvas state if it exists
        if (backCanvasState) {
          canvas.loadFromJSON(backCanvasState, () => {
            canvas.renderAll();
          }, (o, object) => {
            // Revive function - handle image loading errors
            if (object.type === 'image' && object.src && object.src.startsWith('blob:')) {
              console.warn('Skipping blob URL image:', object.src);
            }
          });
        }
      }
      setCurrentImageIndex(productImages.length - 1);
    } else if (productImages.length === 1) {
      setCurrentImageIndex(0);
    }
  };

  const handleDeleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj) {
      canvas.remove(obj);
      canvas.renderAll();
      
      // Check if canvas is now empty
      const remainingObjects = canvas.getObjects().length;
      
      // If canvas is empty and we're on a saved design side, clear that saved design
      if (remainingObjects === 0) {
        if (currentImageIndex === 0 && frontDesignUrl) {
          // Clear front design if we're on front side and it's now empty
          setFrontDesignUrl(null);
        } else if (currentImageIndex > 0 && backDesignUrl) {
          // Clear back design if we're on back side and it's now empty
          setBackDesignUrl(null);
        }
      }
    }
  };

  const createCompositeImage = async (canvas, imageUrl = null) => {
    console.log('🎨 Starting composite image creation...');
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CANVAS_W;
    tempCanvas.height = CANVAS_H;
    const ctx = tempCanvas.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    console.log('   ✓ White background drawn');

    // Load product image - use provided imageUrl or currentImage
    const imageToUse = imageUrl || currentImage;
    console.log('   - Using image:', imageToUse);
    
    const productImg = new Image();
    productImg.crossOrigin = 'anonymous';
    
    await new Promise((resolve) => {
      productImg.onload = () => {
        console.log('   ✓ Product image loaded');
        
        // Draw product (centered and scaled)
        const imgAspect = productImg.width / productImg.height;
        const canvasAspect = CANVAS_W / CANVAS_H;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          drawHeight = CANVAS_H;
          drawWidth = drawHeight * imgAspect;
          drawX = (CANVAS_W - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = CANVAS_W;
          drawHeight = drawWidth / imgAspect;
          drawX = 0;
          drawY = (CANVAS_H - drawHeight) / 2;
        }
        
        ctx.drawImage(productImg, drawX, drawY, drawWidth, drawHeight);
        console.log('   ✓ Product drawn at', { drawX, drawY, drawWidth, drawHeight });
        resolve();
      };
      
      productImg.onerror = () => {
        console.log('   ⚠ Product image failed, using white background');
        resolve();
      };
      
      // Use the image URL
      productImg.src = imageToUse;
    });

    // Extract canvas overlay with maximum quality
    const canvasDataUrl = canvas.toDataURL({ 
      format: 'png', 
      quality: 1.0,
      multiplier: 1
    });
    console.log('   ✓ Canvas extracted, size:', canvasDataUrl.length);
    
    // Draw canvas overlay on top
    const canvasImg = new Image();
    await new Promise((resolve) => {
      canvasImg.onload = () => {
        console.log('   ✓ Canvas overlay loaded, drawing on top...');
        ctx.drawImage(canvasImg, 0, 0, CANVAS_W, CANVAS_H);
        console.log('   ✓ Canvas overlay drawn');
        resolve();
      };
      canvasImg.onerror = () => {
        console.error('   ✗ Overlay failed');
        resolve();
      };
      canvasImg.src = canvasDataUrl;
    });

    // Get final composite
    const finalUrl = tempCanvas.toDataURL('image/png', 0.9);
    console.log('   ✓ Composite created, size:', finalUrl.length);
    
    return finalUrl;
  };

  const handleSavePreview = async () => {
    const canvas = fabricRef.current;
    if (!canvas || canvas.getObjects().length === 0) {
      alert("Please add some text or logo first!");
      return;
    }

    console.log('💾 Creating preview...');
    
    try {
      const compositeUrl = await createCompositeImage(canvas, currentImage);
      setPreviewUrl(compositeUrl);
      setShowPreview(true);
    } catch (err) {
      console.error('❌ Error creating preview:', err);
      alert('Failed to create preview. Check console for details.');
    }
  };

  const handleSaveFrontDesign = async () => {
    const canvas = fabricRef.current;
    if (!canvas || canvas.getObjects().length === 0) {
      alert("Please add some text or logo first!");
      return;
    }

    if (currentImageIndex !== 0) {
      alert("Please switch to FRONT image first!");
      return;
    }

    try {
      const compositeUrl = await createCompositeImage(canvas, productImages[0]);
      setFrontDesignUrl(compositeUrl);
      // Also save the canvas state
      const canvasJSON = canvas.toJSON();
      setFrontCanvasState(canvasJSON);
      alert("✅ Front design saved!");
    } catch (err) {
      console.error('❌ Error saving front design:', err);
      alert('Failed to save front design.');
    }
  };

  const handleSaveBackDesign = async () => {
    const canvas = fabricRef.current;
    if (!canvas || canvas.getObjects().length === 0) {
      alert("Please add some text or logo first!");
      return;
    }

    if (currentImageIndex === 0) {
      alert("Please switch to BACK image first!");
      return;
    }

    try {
      const compositeUrl = await createCompositeImage(canvas, productImages[productImages.length - 1]);
      setBackDesignUrl(compositeUrl);
      // Also save the canvas state
      const canvasJSON = canvas.toJSON();
      setBackCanvasState(canvasJSON);
      alert("✅ Back design saved!");
    } catch (err) {
      console.error('❌ Error saving back design:', err);
      alert('Failed to save back design.');
    }
  };

  const handleAddToCartClick = () => {
    setPendingAddType('customized');
    setShowSizeModal(true);
  };

  const handleSkipAndAddClick = () => {
    setPendingAddType('skip');
    setShowSizeModal(true);
  };

  const handleBuyNowClick = () => {
    const canvas = fabricRef.current;
    const hasCustomization = canvas && canvas.getObjects().length > 0;
    
    if (hasCustomization) {
      setPendingAddType('buyCustomized');
    } else {
      setPendingAddType('buyNow');
    }
    setShowSizeModal(true);
  };

  const confirmAddToCart = async () => {
    if (!onAddToCart || !product) return;
    
    setShowSizeModal(false);
    
    if (pendingAddType === 'skip') {
      // Add without customization
      const isClothing = product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts";
      const normalized = {
        name: product.title,
        price: product.price,
        rating: product.rating?.rate ?? 0,
        photo: product.image,
        description: product.description,
        fakestoreId: product.id,
        customDesignUrl: null,
        isCustomized: false,
        customizationPreview: null,
        ...(isClothing && { size: selectedSize }), // Only add size for clothing
        quantity: selectedQuantity,
      };
      
      onAddToCart(normalized);
      navigate("/carts");
      return;
    }

    if (pendingAddType === 'buyNow') {
      // Buy now without customization
      const isClothing = product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts";
      const normalized = {
        name: product.title,
        price: product.price,
        rating: product.rating?.rate ?? 0,
        photo: product.image,
        description: product.description,
        fakestoreId: product.id,
        customDesignUrl: null,
        isCustomized: false,
        customizationPreview: null,
        ...(isClothing && { size: selectedSize }), // Only add size for clothing
        quantity: selectedQuantity,
      };
      
      navigate('/proceed', { state: { singleItem: normalized } });
      return;
    }

    // Add with customization (customized or buyCustomized)
    const canvas = fabricRef.current;
    const hasCustomization = canvas && canvas.getObjects().length > 0;
    
    if (!hasCustomization) {
      alert("Please add some text or logo first!");
      return;
    }

    setAdding(true);

    try {
      // Use the same composite creation function as Save Preview
      const compositeDataUrl = await createCompositeImage(canvas, currentImage);
      
      console.log('🔍 STEP 1: COMPOSITE IMAGE CREATED');
      console.log('   - Type:', compositeDataUrl.substring(0, 30));
      console.log('   - Size:', compositeDataUrl.length, 'bytes');
      console.log('   - Is base64 PNG:', compositeDataUrl.startsWith('data:image/png'));
      console.log('   - First 100 chars:', compositeDataUrl.substring(0, 100));
      
      // Upload composite image to Cloudinary
      console.log('🔍 STEP 2: UPLOADING TO CLOUDINARY...');
      console.log('   - Uploading composite (NOT original product image)');
      
      const response = await fetch(`${API_BASE_URL}/api/uploads/custom-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: compositeDataUrl }),
      });
      
      const data = await response.json();
      
      console.log('🔍 STEP 3: CLOUDINARY RESPONSE');
      console.log('   - Success:', !!data?.url);
      console.log('   - Uploaded URL:', data?.url);
      console.log('   - Full response:', data);
      
      const uploadedUrl = data?.url || null;
      
      if (!uploadedUrl) {
        console.error('❌ CRITICAL: Cloudinary did not return a URL!');
        throw new Error('Cloudinary upload failed - no URL returned');
      }
      
      const isClothing = product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts";
      const normalized = {
        name: product.title,
        price: product.price,
        rating: product.rating?.rate ?? 0,
        photo: product.image, // Original product image
        description: product.description,
        fakestoreId: product.id,
        customDesignUrl: uploadedUrl, // Composite image URL
        isCustomized: true,
        customizationPreview: uploadedUrl, // Composite image URL
        frontDesignUrl: frontDesignUrl || null,
        backDesignUrl: backDesignUrl || null,
        ...(isClothing && { size: selectedSize }), // Only add size for clothing
        quantity: selectedQuantity,
      };
      
      console.log('🔍 STEP 4: CART ITEM OBJECT');
      console.log('   - name:', normalized.name);
      console.log('   - isCustomized:', normalized.isCustomized);
      console.log('   - photo (original):', normalized.photo);
      console.log('   - customizationPreview (composite):', normalized.customizationPreview);
      console.log('   - customDesignUrl (composite):', normalized.customDesignUrl);
      console.log('   - size:', normalized.size);
      console.log('   - quantity:', normalized.quantity);
      console.log('   - Full cart item:', JSON.stringify(normalized, null, 2));
      
      console.log('✅ ADDING TO CART WITH COMPOSITE URL');
      
      if (pendingAddType === 'buyCustomized') {
        // Buy now with customization
        navigate('/proceed', { state: { singleItem: normalized } });
      } else {
        // Add to cart with customization
        onAddToCart(normalized);
        navigate("/carts");
      }
      
    } catch (err) {
      console.error('❌ Error creating composite:', err);
      alert('Failed to create design. Please try again or check console for details.');
    } finally {
      setAdding(false);
    }
  };



  if (loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Preparing designer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 space-y-4">
            <div className="relative w-full h-64 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Failed to load image:', currentImage);
                    e.target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Available';
                  }}
                />
              ) : (
                <div className="text-center p-4">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">No image available</p>
                </div>
              )}
              {/* Image indicator badge */}
              <div className="absolute top-2 right-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg">
                {currentImageIndex === 0 ? '👕 FRONT' : '🔄 BACK'}
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">{product.title}</h1>
            <p className="text-sm text-gray-500 capitalize">{product.category}</p>
            <p className="text-gray-700 text-sm">{product.description}</p>
            <p className="text-2xl font-extrabold text-indigo-700 mt-2">
              ₹{Number(product.price).toFixed(2)}
            </p>
          </div>

          <div className="md:w-2/3 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-2">
              <button
                onClick={handleAddText}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition whitespace-nowrap"
              >
                Add Text
              </button>
              <label className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 transition cursor-pointer whitespace-nowrap">
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleSavePreview}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 transition whitespace-nowrap"
              >
                💾 Preview
              </button>
              <button
                onClick={handleBringToFront}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap ${
                  currentImageIndex === 0
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              >
                👕 Front {currentImageIndex === 0 ? '✓' : ''}
              </button>
              <button
                onClick={handleSendToBack}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap ${
                  currentImageIndex > 0
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              >
                🔄 Back {currentImageIndex > 0 ? '✓' : ''}
              </button>
              <button
                onClick={handleSaveFrontDesign}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap ${
                  frontDesignUrl
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              >
                💾 Save Front {frontDesignUrl ? '✓' : ''}
              </button>
              {frontDesignUrl && (
                <button
                  onClick={() => {
                    setFrontDesignUrl(null);
                    setFrontCanvasState(null); // Also clear canvas state
                    // If currently on front side, clear the canvas
                    if (currentImageIndex === 0) {
                      const canvas = fabricRef.current;
                      if (canvas) {
                        canvas.clear();
                        canvas.renderAll();
                      }
                    }
                    alert('✅ Front design cleared!');
                  }}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition whitespace-nowrap border border-red-300"
                >
                  🗑️ Clear Front
                </button>
              )}
              <button
                onClick={handleSaveBackDesign}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap ${
                  backDesignUrl
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'
                }`}
              >
                💾 Save Back {backDesignUrl ? '✓' : ''}
              </button>
              {backDesignUrl && (
                <button
                  onClick={() => {
                    setBackDesignUrl(null);
                    setBackCanvasState(null); // Also clear canvas state
                    // If currently on back side, clear the canvas
                    if (currentImageIndex > 0) {
                      const canvas = fabricRef.current;
                      if (canvas) {
                        canvas.clear();
                        canvas.renderAll();
                      }
                    }
                    alert('✅ Back design cleared!');
                  }}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition whitespace-nowrap border border-red-300"
                >
                  🗑️ Clear Back
                </button>
              )}
              {(frontDesignUrl || backDesignUrl) && (
                <button
                  onClick={() => {
                    setShowBothDesigns(true);
                    setBothDesignsIndex(0);
                  }}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition shadow-lg whitespace-nowrap"
                >
                  👀 View
                </button>
              )}
            </div>

            {/* Canvas container with extra top padding for buttons */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-white flex items-center justify-center p-6 pt-16">
              <div className="relative w-[520px] max-w-full">
                {/* Image indicator badge - positioned outside canvas */}
                <div className="absolute -top-12 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 z-20">
                  <span className="text-lg">{currentImageIndex === 0 ? '👕' : '🔄'}</span>
                  {currentImageIndex === 0 ? 'FRONT' : 'BACK'}
                </div>
                
                {/* Delete button - positioned outside canvas */}
                <button
                  onClick={handleDeleteSelected}
                  className="absolute -top-12 left-0 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transition z-20"
                  title="Delete selected element (click element first, then click this)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Product image as background */}
                <div className="relative w-full" style={{ aspectRatio: '520/620' }}>
                  <img
                    src={currentImage}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none opacity-90"
                    draggable={false}
                  />
                  
                  {/* Fabric canvas overlays the product */}
                  <div className="absolute inset-0">
                    <canvas ref={canvasRef} className="block" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={handleSkipAndAddClick}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold rounded-xl bg-white border-2 border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50 transition shadow-sm"
              >
                Skip & Add to Cart
              </button>
              <button
                onClick={handleAddToCartClick}
                disabled={adding}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adding ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">Creating...</span>
                  </span>
                ) : (
                  <>
                    <span className="hidden sm:inline">✨ Add Customized</span>
                    <span className="sm:hidden">✨ Add</span>
                  </>
                )}
              </button>
            </div>
            
            <button
              onClick={handleBuyNowClick}
              disabled={adding}
              className="w-full px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-3"
            >
              {adding ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Processing...</span>
                  <span className="sm:hidden">Wait...</span>
                </span>
              ) : (
                <>
                  {(frontDesignUrl || backDesignUrl) ? (
                    <>
                      <span className="hidden sm:inline">🛒 Buy Customized Product</span>
                      <span className="sm:hidden">🛒 Buy Custom</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">🛒 Buy Now</span>
                      <span className="sm:hidden">🛒 Buy</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Preview: Product + Your Design</h3>
            <p className="text-sm text-gray-600 mb-4">This is what will be saved and shown in orders</p>
            
            <div className="bg-gray-100 p-4 rounded-xl mb-4">
              <img 
                src={previewUrl} 
                alt="Composite Preview" 
                className="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg shadow-xl"
              />
            </div>
            
            <div className="flex gap-3 justify-center">
              <a 
                href={previewUrl} 
                download="my-design-preview.png"
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
              >
                Download Preview
              </a>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>✓ Looks good?</strong> Click "Add Customized Product to Cart" to save this design with your order.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Size and Quantity Selection Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSizeModal(false)}>
          <div className="relative max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowSizeModal(false)}
              className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 shadow-lg hover:bg-red-700 transition z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {(product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts") 
                ? 'Select Size & Quantity' 
                : 'Select Quantity'}
            </h3>
            
            {/* Size Selection - Only for clothing categories */}
            {(product.category === "men's clothing" || product.category === "women's clothing" || product.category === "t-shirts") && (
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Size</label>
                <div className="flex gap-2 justify-center">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg font-bold text-sm transition-all duration-200 ${
                        selectedSize === size
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">Select Quantity</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  disabled={selectedQuantity === 1}
                  className={`w-10 h-10 rounded-lg font-bold text-xl transition-colors ${
                    selectedQuantity === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900 min-w-[60px] text-center">
                  {selectedQuantity}
                </span>
                <button
                  onClick={() => setSelectedQuantity(Math.min(99, selectedQuantity + 1))}
                  disabled={selectedQuantity === 99}
                  className={`w-10 h-10 rounded-lg font-bold text-xl transition-colors ${
                    selectedQuantity === 99
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Confirm Button */}
            <button
              onClick={confirmAddToCart}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {pendingAddType === 'buyNow' || pendingAddType === 'buyCustomized' ? 'Buy Now' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}

      {/* View Both Designs Modal */}
      {showBothDesigns && (frontDesignUrl || backDesignUrl) && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowBothDesigns(false)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowBothDesigns(false)}
              className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Designs</h3>
            <p className="text-sm text-gray-600 mb-4">
              {bothDesignsIndex === 0 && frontDesignUrl ? '👕 FRONT DESIGN' : '🔄 BACK DESIGN'}
            </p>
            
            <div className="bg-gray-100 p-4 rounded-xl mb-4 flex items-center justify-center" style={{ minHeight: '500px' }}>
              <div className="relative" style={{ width: '400px', aspectRatio: '520/620' }}>
                {/* Design composite (already includes product image) */}
                <img 
                  src={bothDesignsIndex === 0 ? frontDesignUrl : backDesignUrl} 
                  alt={bothDesignsIndex === 0 ? 'Front Design' : 'Back Design'} 
                  className="w-full h-full object-contain rounded-lg shadow-xl"
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-center mb-4">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  if (bothDesignsIndex === 0 && backDesignUrl) {
                    setBothDesignsIndex(1);
                  } else if (bothDesignsIndex === 1) {
                    setBothDesignsIndex(0);
                  }
                }}
                disabled={bothDesignsIndex === 0 && !backDesignUrl}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Download Button */}
              <a 
                href={bothDesignsIndex === 0 ? frontDesignUrl : backDesignUrl} 
                download={bothDesignsIndex === 0 ? 'front-design.png' : 'back-design.png'}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download {bothDesignsIndex === 0 ? 'Front' : 'Back'}
              </a>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  if (bothDesignsIndex === 0 && backDesignUrl) {
                    setBothDesignsIndex(1);
                  } else if (bothDesignsIndex === 1 && frontDesignUrl) {
                    setBothDesignsIndex(0);
                  }
                }}
                disabled={bothDesignsIndex === 1 && !frontDesignUrl}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowBothDesigns(false)}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customize;

