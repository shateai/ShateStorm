
import PptxGenJS from "pptxgenjs";
import { PresentationData, Slide } from "../types";

// Pomocná funkce pro vyčištění textu od Markdown artefaktů
const cleanText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "") // Odstraní **
    .replace(/#/g, "")    // Odstraní #
    .replace(/\*/g, "")   // Odstraní samostatné *
    .replace(/__/g, "")   // Odstraní __
    .trim();
};

// Pomocná funkce pro výpočet optimální velikosti písma na základě délky textu a počtu odrážek
const getDynamicFontSize = (textArray: string[], baseSize: number): number => {
  const totalChars = textArray.reduce((acc, curr) => acc + curr.length, 0);
  const itemCount = textArray.length;
  
  let size = baseSize;
  
  // Agresivnější zmenšování na základě celkového počtu znaků
  if (totalChars > 1000) size = baseSize - 8;
  else if (totalChars > 700) size = baseSize - 6;
  else if (totalChars > 450) size = baseSize - 4;
  else if (totalChars > 300) size = baseSize - 2;
  
  // Další korekce na základě počtu položek (aby se vešly vertikálně)
  if (itemCount > 7) size -= 2;
  else if (itemCount > 5) size -= 1;
  
  return Math.max(size, 8); // Minimum je 8pt
};

// Helper to crop image to a rounded rectangle using Canvas
const processRoundedImage = async (base64Data: string, borderRadiusRatio: number = 0.1): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64Data); // Fallback
                return;
            }

            // Draw rounded rect path
            const radius = Math.min(img.width, img.height) * borderRadiusRatio;
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(img.width - radius, 0);
            ctx.quadraticCurveTo(img.width, 0, img.width, radius);
            ctx.lineTo(img.width, img.height - radius);
            ctx.quadraticCurveTo(img.width, img.height, img.width - radius, img.height);
            ctx.lineTo(radius, img.height);
            ctx.quadraticCurveTo(0, img.height, 0, img.height - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.clip();

            // Draw image inside the clip
            ctx.drawImage(img, 0, 0);
            
            // Export
            const newData = canvas.toDataURL('image/png').split(',')[1];
            resolve(newData);
        };
        img.onerror = () => resolve(base64Data); // Fallback
        img.src = `data:image/png;base64,${base64Data}`;
    });
};

export const generatePPTX = async (data: PresentationData) => {
  const pres = new PptxGenJS();
  
  const title = cleanText(data.presentationTitle || data.topic);
  pres.title = title;
  pres.subject = "AI Generated Presentation";
  
  pres.layout = "LAYOUT_16x9";

  const BG_COLOR = "020617";   
  const CARD_COLOR = "1e293b"; 
  const TEXT_COLOR = "FFFFFF"; 
  const ACCENT_COLOR = "3b82f6"; 
  const BULLET_COLOR = "60a5fa"; 
  const BORDER_COLOR = "475569"; 

  pres.defineSlideMaster({
    title: "CANVAS_MASTER",
    background: { color: BG_COLOR },
  });

  const totalSlides = data.slides.length;

  const renderCard = async (pptSlide: PptxGenJS.Slide, slideData: Slide | null, index: number, xOffset: number, isSources: boolean = false) => {
     const cardX = 0.5 + xOffset;
     const cardY = 0.4;
     const cardW = 9;
     const cardH = 4.825;

     pptSlide.addShape(pres.ShapeType.roundRect, {
        x: cardX, y: cardY, w: cardW, h: cardH,
        fill: { color: CARD_COLOR },
        line: { color: BORDER_COLOR, width: 2.0 },
        rectRadius: 0.15
    });

    if (isSources) {
         pptSlide.addText("Zdroje & Odkazy", {
            x: cardX + 0.5, y: cardY + 0.4, w: 8.0, h: 0.8,
            fontSize: 32,
            fontFace: "Arial Black",
            color: TEXT_COLOR,
            bold: true,
            border: { pt: 0, pb: 2, color: BORDER_COLOR } 
        });
        
        const sourceText = data.sources.map(s => ({ 
            text: cleanText(s.title), 
            options: { hyperlink: { url: s.uri }, breakLine: true, fontSize: 14 } 
        }));
        pptSlide.addText(sourceText, {
            x: cardX + 0.5, y: cardY + 1.4, w: 8.0, h: 2.5,
            color: ACCENT_COLOR, 
            bullet: { type: "bullet", color: "94a3b8" }, 
            paraSpaceAfter: 10,
            bold: true,
            valign: "top"
        });

        pptSlide.addText([
            { text: "Vytvořeno pomocí AI Student Presenter", options: { color: "94a3b8" } }
        ], {
            x: cardX + 0.5, y: cardY + 4.2, w: 8.0, h: 0.5,
            fontSize: 10,
            align: "center"
        });
        
    } else if (slideData) {
        const cleanedTitle = cleanText(slideData.title);
        const cleanedBullets = slideData.bulletPoints.map(bp => cleanText(bp));
        
        // Dynamické písmo pro nadpis
        const titleFontSize = cleanedTitle.length > 50 ? 20 : 26;
        
        // Dynamické písmo pro body (pro zamezení přetečení)
        const bulletFontSize = getDynamicFontSize(cleanedBullets, 14);

        pptSlide.addText((index + 1).toString().padStart(2, '0'), {
            x: cardX + 0.4, y: cardY + 0.2, w: 1, h: 0.5,
            fontSize: 30,
            fontFace: "Arial Black",
            color: "334155",
            transparency: 0
        });

        pptSlide.addText(cleanedTitle, {
            x: cardX + 0.4, y: cardY + 0.7, w: 3.8, h: 1.2,
            fontSize: titleFontSize,
            fontFace: "Arial Black",
            color: TEXT_COLOR,
            bold: true,
            valign: "top"
        });

        const bulletObjects = cleanedBullets.map(bp => ({ text: bp, options: { breakLine: true } }));
        pptSlide.addText(bulletObjects, {
            x: cardX + 0.4, y: cardY + 2.0, w: 3.8, h: 2.6,
            fontSize: bulletFontSize,
            fontFace: "Arial",
            color: "cbd5e1", 
            bullet: { type: "bullet", color: BULLET_COLOR },
            paraSpaceAfter: bulletFontSize > 12 ? 8 : 4,
            bold: true,
            valign: "top"
        });

        const IMG_X = cardX + 4.6; 
        const IMG_SIZE = 4.0;
        
        if (slideData.imageBase64) {
             const roundedImage = await processRoundedImage(slideData.imageBase64, 0.15);
             pptSlide.addImage({
                data: `image/png;base64,${roundedImage}`,
                x: IMG_X, y: cardY + 0.4, w: IMG_SIZE, h: IMG_SIZE, 
                sizing: { type: "contain", w: IMG_SIZE, h: IMG_SIZE }
            });
        }
        
        if (slideData.audioBase64 && xOffset === 0) {
            pptSlide.addMedia({
                type: "audio",
                data: `data:audio/wav;base64,${slideData.audioBase64}`,
                x: cardX + 8.2, y: cardY + 4.1, w: 0.4, h: 0.4
            });
        }
    }
  };

  for (let i = 0; i < totalSlides; i++) {
    const slide = data.slides[i];
    const pptSlide = pres.addSlide({ masterName: "CANVAS_MASTER" });
    pptSlide.transition = { type: "morph", duration: 800 };

    if (i > 0) {
        await renderCard(pptSlide, data.slides[i-1], i-1, -10.5); 
    }
    await renderCard(pptSlide, slide, i, 0);
    if (i < totalSlides - 1) {
        await renderCard(pptSlide, data.slides[i+1], i+1, 10.5); 
    } else if (data.sources.length > 0) {
        await renderCard(pptSlide, null, -1, 10.5, true);
    }
    pptSlide.addNotes(cleanText(slide.speakerNotes));
  }

  if (data.sources.length > 0) {
      const pptSlide = pres.addSlide({ masterName: "CANVAS_MASTER" });
      pptSlide.transition = { type: "morph", duration: 800 };
      if (totalSlides > 0) {
          await renderCard(pptSlide, data.slides[totalSlides - 1], totalSlides - 1, -10.5);
      }
      await renderCard(pptSlide, null, -1, 0, true);
  }

  await pres.writeFile({ fileName: `${title.replace(/[^a-z0-9]/gi, '_').slice(0,30)}_Prezentace.pptx` });
};
