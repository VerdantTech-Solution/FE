/**
 * Parse products from AI chatbot response
 * The response may contain JSON with product information
 */

import type { ChatProduct } from '@/components/ChatProductCard';

export const parseProductsFromMessage = (message: string): {
  products: ChatProduct[];
  textWithoutProducts: string;
} => {
  const products: ChatProduct[] = [];
  let textWithoutProducts = message;

  try {
    // Try to find JSON objects in the message
    // Look for patterns like {"name": "...", "price": ..., ...}
    const jsonPattern = /\{[\s\S]*?"(?:name|title|productName)"[\s\S]*?\}/g;
    const jsonMatches = message.match(jsonPattern);

    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          
          // Check if it's a product object
          if (parsed.name || parsed.title || parsed.productName) {
            const product: ChatProduct = {
              name: parsed.name || parsed.title || parsed.productName || '',
              description: parsed.description || '',
              price: parsed.price || parsed.unitPrice || undefined,
              imageUrl: parsed.imageUrl || parsed.image || parsed.imageLink || '',
              productLink: parsed.productLink || parsed.link || parsed.url || '',
              productId: parsed.productId || parsed.id || undefined,
            };

            // Extract product ID from link if not provided
            if (!product.productId && product.productLink) {
              const idMatch = product.productLink.match(/\/product\/(\d+)/);
              if (idMatch) {
                product.productId = parseInt(idMatch[1], 10);
              }
            }

            products.push(product);
            // Remove the JSON from text
            textWithoutProducts = textWithoutProducts.replace(match, '').trim();
          }
        } catch (e) {
          // Not valid JSON, continue
        }
      }
    }

    // Also try to parse if the entire message is a JSON array or object with products
    try {
      const trimmed = message.trim();
      
      // Try to find JSON object/array in the message
      let jsonStart = -1;
      let jsonEnd = -1;
      let braceCount = 0;
      
      for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] === '{' || trimmed[i] === '[') {
          if (jsonStart === -1) jsonStart = i;
          braceCount++;
        } else if (trimmed[i] === '}' || trimmed[i] === ']') {
          braceCount--;
          if (braceCount === 0 && jsonStart !== -1) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = trimmed.substring(jsonStart, jsonEnd);
        const parsed = JSON.parse(jsonStr);
        
        if (Array.isArray(parsed)) {
          // Array of products
          parsed.forEach((item: any) => {
            if (item.name || item.title || item.productName) {
              const product: ChatProduct = {
                name: item.name || item.title || item.productName || '',
                description: item.description || '',
                price: item.price || item.unitPrice || undefined,
                imageUrl: item.imageUrl || item.image || item.imageLink || '',
                productLink: item.productLink || item.link || item.url || '',
                productId: item.productId || item.id || undefined,
              };
              
              // Extract product ID from link if not provided
              if (!product.productId && product.productLink) {
                const idMatch = product.productLink.match(/\/product\/(\d+)/);
                if (idMatch) {
                  product.productId = parseInt(idMatch[1], 10);
                }
              }
              
              products.push(product);
            }
          });
          textWithoutProducts = (trimmed.substring(0, jsonStart) + trimmed.substring(jsonEnd)).trim();
        } else if (parsed.products && Array.isArray(parsed.products)) {
          // Object with products array (e.g., {intro: "", products: [], outro: ""})
          if (parsed.products.length > 0) {
            parsed.products.forEach((item: any) => {
              if (item.name || item.title || item.productName) {
                const product: ChatProduct = {
                  name: item.name || item.title || item.productName || '',
                  description: item.description || '',
                  price: item.price || item.unitPrice || undefined,
                  imageUrl: item.imageUrl || item.image || item.imageLink || '',
                  productLink: item.productLink || item.link || item.url || '',
                  productId: item.productId || item.id || undefined,
                };
                
                // Extract product ID from link if not provided
                if (!product.productId && product.productLink) {
                  const idMatch = product.productLink.match(/\/product\/(\d+)/);
                  if (idMatch) {
                    product.productId = parseInt(idMatch[1], 10);
                  }
                }
                
                products.push(product);
              }
            });
          }
          
          // Combine intro and outro as text, but keep the rest of the message for parsing
          const intro = parsed.intro || '';
          const outro = parsed.outro || '';
          const combinedText = [intro, outro].filter(Boolean).join('\n\n').trim();
          
          // If products array is empty, we'll parse from the rest of the message
          // Remove the JSON part but keep the rest for text parsing
          if (parsed.products.length === 0) {
            textWithoutProducts = message; // Keep full message for text parsing
          } else {
            textWithoutProducts = combinedText || (trimmed.substring(0, jsonStart) + trimmed.substring(jsonEnd)).trim();
          }
        }
      }
    } catch (e) {
      // Not a JSON message, continue with text parsing
    }

    // Try to extract products from structured text format (fallback)
    // Look for patterns like:
    // **Product Name**
    // Mô tả: ...
    // Giá: ...
    // Ảnh: ...
    // Link: ...
    if (products.length === 0) {
      // Pattern 1: Products with markdown bold names followed by Mô tả, Giá, Ảnh, Link
      const boldProductPattern = /\*\*([^*]+?)\*\*/g;
      const boldMatches = Array.from(message.matchAll(boldProductPattern));
      
      if (boldMatches.length > 0) {
        // Extract all URLs first
        const urlPattern = /https?:\/\/[^\s\)\n]+/g;
        const allUrls = message.match(urlPattern) || [];
        const imageUrls = allUrls.filter(url => 
          url.includes('image') || url.includes('cloudinary') || url.includes('res.cloudinary')
        );
        const productUrls = allUrls.filter(url => url.includes('product'));
        
        boldMatches.forEach((match, index) => {
          const productName = match[1].trim();
          const matchIndex = match.index || 0;
          
          // Find the section after this product name (until next product or end)
          const nextMatch = boldMatches[index + 1];
          const sectionEnd = nextMatch ? nextMatch.index : message.length;
          const section = message.substring(matchIndex, sectionEnd);
          
          let description = '';
          let price: number | undefined = undefined;
          let imageUrl = '';
          let productLink = '';
          
          // Extract description
          const descMatch = section.match(/(?:Mô tả|Description)[:\-]?\s*([^\n]+)/i);
          if (descMatch) {
            description = descMatch[1].trim();
          }
          
          // Extract price
          const priceMatch = section.match(/(?:Giá|Price)[:\-]?\s*([^\n]+)/i);
          if (priceMatch) {
            const priceText = priceMatch[1].trim();
            const priceNumMatch = priceText.match(/(\d+(?:[.,]\d+)?)/);
            if (priceNumMatch) {
              price = parseFloat(priceNumMatch[1].replace(/,/g, '.'));
            }
          }
          
          // Extract image URL (look for URL after "Ảnh:" or "Image:")
          const imageMatch = section.match(/(?:Ảnh|Image)[:\-]?\s*(https?:\/\/[^\s\)\n]+)/i);
          if (imageMatch) {
            imageUrl = imageMatch[1].trim();
          } else if (imageUrls[index]) {
            imageUrl = imageUrls[index];
          }
          
          // Extract product link (look for URL after "Link:" or "URL:")
          const linkMatch = section.match(/(?:Link|URL)[:\-]?\s*(https?:\/\/[^\s\)\n]+)/i);
          if (linkMatch) {
            productLink = linkMatch[1].trim();
          } else if (productUrls[index]) {
            productLink = productUrls[index];
          }
          
          // Only add if we have at least a name and a link
          if (productName && (productLink || imageUrl)) {
            products.push({
              name: productName,
              description: description,
              price: price,
              imageUrl: imageUrl,
              productLink: productLink,
            });
          }
        });
        
        // Remove all parsed product sections from text
        if (products.length > 0) {
          products.forEach((product) => {
            // Remove product name (bold)
            textWithoutProducts = textWithoutProducts.replace(new RegExp(`\\*\\*${product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*`, 'g'), '');
            // Remove description line
            if (product.description) {
              textWithoutProducts = textWithoutProducts.replace(new RegExp(`(?:Mô tả|Description)[:\\-]?\\s*${product.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '');
            }
            // Remove price line
            if (product.price) {
              textWithoutProducts = textWithoutProducts.replace(/(?:Giá|Price)[:\-]?\s*[\d.,\s]+(?:VNĐ|đ)?/gi, '');
            }
            // Remove image URL
            if (product.imageUrl) {
              textWithoutProducts = textWithoutProducts.replace(new RegExp(`(?:Ảnh|Image)[:\\-]?\\s*${product.imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '');
            }
            // Remove product link
            if (product.productLink) {
              textWithoutProducts = textWithoutProducts.replace(new RegExp(`(?:Link|URL)[:\\-]?\\s*${product.productLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), '');
            }
          });
        }
      }
      
      // Pattern 2: Split by product markers like "**Sản phẩm 1:**" or "**Product 1:**"
      if (products.length === 0) {
        const productSections = message.split(/(?:\*\*)?(?:Sản phẩm|Product)\s*\d+[:\-]?\s*\*?\*/gi);
        
        if (productSections.length > 1) {
          const urlPattern = /https?:\/\/[^\s\)\n]+/g;
          const allUrls = message.match(urlPattern) || [];
          const imageUrls = allUrls.filter(url => 
            url.includes('image') || url.includes('cloudinary') || url.includes('res.cloudinary')
          );
          const productUrls = allUrls.filter(url => url.includes('product'));
          
          productSections.slice(1).forEach((section, index) => {
            const lines = section.split('\n').map(l => l.trim()).filter(l => l);
            let name = '';
            let description = '';
            let price: number | undefined = undefined;
            
            lines.forEach(line => {
              // Extract name (usually first line or after "**")
              if (!name && line && !line.match(/^(?:Mô tả|Description|Giá|Price|Ảnh|Image|Link|URL)/i)) {
                name = line.replace(/^\*\*|\*\*$/g, '').trim();
              }
              
              // Extract description
              if (line.match(/^(?:Mô tả|Description)/i)) {
                description = line.replace(/^(?:Mô tả|Description)[:\-]?\s*/i, '').trim();
              }
              
              // Extract price
              if (line.match(/^(?:Giá|Price)/i)) {
                const priceMatch = line.match(/(\d+(?:[.,]\d+)?)/);
                if (priceMatch) {
                  price = parseFloat(priceMatch[1].replace(',', '.'));
                }
              }
            });
            
            if (name) {
              products.push({
                name: name,
                description: description,
                price: price,
                imageUrl: imageUrls[index] || '',
                productLink: productUrls[index] || '',
              });
            }
          });
        }
      }
      
      // Pattern 3: Try to find products by product URLs and extract info from surrounding text
      if (products.length === 0) {
        const urlPattern = /https?:\/\/[^\s\)\n]+/g;
        const urls = message.match(urlPattern) || [];
        const productUrls = urls.filter(url => url.includes('product'));
        const imageUrls = urls.filter(url => 
          url.includes('image') || url.includes('cloudinary') || url.includes('res.cloudinary')
        );
        
        // Try to find product names and info near URLs
        productUrls.forEach((url, index) => {
          const urlIndex = message.indexOf(url);
          const beforeUrl = message.substring(Math.max(0, urlIndex - 500), urlIndex);
          const afterUrl = message.substring(urlIndex, Math.min(message.length, urlIndex + 200));
          const section = beforeUrl + afterUrl;
          
          let name = '';
          let description = '';
          let price: number | undefined = undefined;
          let imageUrl = imageUrls[index] || '';
          
          // Look for bold product name
          const boldMatch = beforeUrl.match(/\*\*([^*]+?)\*\*/);
          if (boldMatch) {
            name = boldMatch[1].trim();
          } else {
            // Look for "Sản phẩm" or "Product" pattern
            const nameMatch = beforeUrl.match(/(?:Sản phẩm|Product)\s*\d+[:\-]?\s*([^\n]+?)(?:\n|$)/i);
            if (nameMatch) {
              name = nameMatch[1].trim();
            } else {
              // Look for text before "Ảnh:" or "Link:" markers
              const beforeMarkers = beforeUrl.split(/(?:Ảnh|Image|Link|URL|Giá|Price)[:\-]?/i);
              if (beforeMarkers.length > 0) {
                const potentialName = beforeMarkers[beforeMarkers.length - 1]
                  .split('\n')
                  .filter(line => line.trim())
                  .pop()?.trim();
                if (potentialName && potentialName.length > 3 && potentialName.length < 100) {
                  name = potentialName;
                }
              }
            }
          }
          
          // Extract description from section
          const descMatch = section.match(/(?:Mô tả|Description)[:\-]?\s*([^\n]+?)(?:\n|(?:Ảnh|Image|Link|URL|Giá|Price))/i);
          if (descMatch) {
            description = descMatch[1].trim();
          }
          
          // Extract price from section
          const priceMatch = section.match(/(?:Giá|Price)[:\-]?\s*([\d.,\s]+)\s*(?:VNĐ|đ|VND)?/i);
          if (priceMatch) {
            const priceText = priceMatch[1].replace(/[.,\s]/g, '');
            const priceNum = parseInt(priceText, 10);
            if (!isNaN(priceNum)) {
              price = priceNum;
            }
          }
          
          // Extract image URL from section
          const imageMatch = section.match(/(?:Ảnh|Image)[:\-]?\s*(https?:\/\/[^\s\)\n]+)/i);
          if (imageMatch) {
            imageUrl = imageMatch[1].trim();
          }
          
          // Extract product ID from URL
          const idMatch = url.match(/(?:^|\/)(?:product|products)\/(\d+)/i);
          const productId = idMatch ? parseInt(idMatch[1], 10) : undefined;
          
          // Always add product if we have productId or URL, even without name
          // The component will fetch full info from API using productId
          if (productId || url.includes('product')) {
            products.push({
              name: name || (productId ? `Sản phẩm #${productId}` : `Sản phẩm ${index + 1}`),
              description: description,
              price: price,
              imageUrl: imageUrl,
              productLink: url,
              productId: productId,
            });
          }
        });
      }
    }

  } catch (error) {
    console.error('Error parsing products from message:', error);
  }

  // Clean up text - remove multiple newlines and extra spaces
  textWithoutProducts = textWithoutProducts
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Debug log
  if (products.length > 0) {
    console.log('[ChatProductParser] Found products:', products.length, products);
    console.log('[ChatProductParser] Text without products:', textWithoutProducts.substring(0, 100));
  }

  return { products, textWithoutProducts };
};

