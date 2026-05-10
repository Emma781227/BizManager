"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import QRCode from "qrcode";

const AFRICAN_DIAL_CODES = [
  { label: "CM +237", value: "+237" },
  { label: "SN +221", value: "+221" },
  { label: "CI +225", value: "+225" },
  { label: "NG +234", value: "+234" },
  { label: "GH +233", value: "+233" },
  { label: "KE +254", value: "+254" },
  { label: "MA +212", value: "+212" },
  { label: "TN +216", value: "+216" },
  { label: "DZ +213", value: "+213" },
  { label: "ET +251", value: "+251" },
  { label: "ZA +27", value: "+27" },
  { label: "UG +256", value: "+256" },
  { label: "TZ +255", value: "+255" },
  { label: "RW +250", value: "+250" },
  { label: "BF +226", value: "+226" },
  { label: "ML +223", value: "+223" },
  { label: "NE +227", value: "+227" },
  { label: "TG +228", value: "+228" },
  { label: "BJ +229", value: "+229" },
  { label: "CD +243", value: "+243" },
];

type PhoneParts = { dialCode: string; localNumber: string };

type DayHours = {
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
};

type OpeningHoursData = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

type UIState = { loading: boolean; saving: boolean; error: string | null; success: string | null };

type Shop = {
  slug: string;
  name: string;
  notificationEmail: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  regionCountry: string | null;
  whatsappNumber: string;
  category: string | null;
  openingHours: string | null;
  isPublished: boolean;
};

const initialState = {
  slug: "",
  name: "",
  notificationEmail: "",
  logoUrl: "",
  coverUrl: "",
  description: "",
  address: "",
  city: "",
  postalCode: "",
  regionCountry: "",
  whatsappNumber: "",
  category: "",
  openingHours: "",
  isPublished: true,
};

function splitPhoneNumber(phone: string | null | undefined) {
  const sanitized = (phone ?? "").trim();
  const sortedCodes = [...AFRICAN_DIAL_CODES].sort((a, b) => b.value.length - a.value.length);
  const matchingCode = sortedCodes.find((item) => sanitized.startsWith(item.value));

  if (matchingCode) {
    return {
      dialCode: matchingCode.value,
      localNumber: sanitized.slice(matchingCode.value.length).replace(/\D/g, ""),
    };
  }

  const genericMatch = sanitized.match(/^(\+\d{1,4})(\d+)$/);
  if (genericMatch) {
    return { dialCode: genericMatch[1], localNumber: genericMatch[2] };
  }

  return { dialCode: "+237", localNumber: sanitized.replace(/\D/g, "") };
}

function splitOpeningHours(value: string | null | undefined): OpeningHoursData {
  const defaultHours: DayHours = { isOpen: true, openingTime: "08:00", closingTime: "18:00" };
  const defaultData: OpeningHoursData = {
    monday: defaultHours,
    tuesday: defaultHours,
    wednesday: defaultHours,
    thursday: defaultHours,
    friday: defaultHours,
    saturday: defaultHours,
    sunday: { isOpen: false, openingTime: "", closingTime: "" },
  };

  const sanitized = (value ?? "").trim();
  if (!sanitized) return defaultData;

  // Essayer de parser comme JSON (nouveau format)
  try {
    const parsed = JSON.parse(sanitized) as OpeningHoursData;
    // Valider la structure
    const days: (keyof OpeningHoursData)[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const isValid = days.every((day) => {
      const dayData = parsed[day];
      return dayData && typeof dayData.isOpen === "boolean" && typeof dayData.openingTime === "string" && typeof dayData.closingTime === "string";
    });
    if (isValid) return parsed;
  } catch {
    // Pas du JSON, continuer
  }

  // Format ancien "HH:MM-HH:MM"
  const match = sanitized.match(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/);
  if (match) {
    const openingTime = `${match[1]}:${match[2]}`;
    const closingTime = `${match[3]}:${match[4]}`;
    const dayHours: DayHours = { isOpen: true, openingTime, closingTime };
    return {
      monday: dayHours,
      tuesday: dayHours,
      wednesday: dayHours,
      thursday: dayHours,
      friday: dayHours,
      saturday: dayHours,
      sunday: { isOpen: false, openingTime: "", closingTime: "" },
    };
  }

  return defaultData;
}

function parseJsonSafe<T>(raw: string): T | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const [form, setForm] = useState(initialState);
  const [phone, setPhone] = useState<PhoneParts>({ dialCode: "+237", localNumber: "" });
  const [hours, setHours] = useState<OpeningHoursData>({
    monday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    tuesday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    wednesday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    thursday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    friday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    saturday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    sunday: { isOpen: false, openingTime: "", closingTime: "" },
  });
  const [uiState, setUIState] = useState<UIState>({ loading: true, saving: false, error: null, success: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [editGeneralOpen, setEditGeneralOpen] = useState(false);
  const [editForm, setEditForm] = useState(initialState);
  const [editPhone, setEditPhone] = useState<PhoneParts>({ dialCode: "+237", localNumber: "" });
  const [editHoursOpen, setEditHoursOpen] = useState(false);
  const [editHours, setEditHours] = useState<OpeningHoursData>({
    monday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    tuesday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    wednesday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    thursday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    friday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    saturday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
    sunday: { isOpen: false, openingTime: "", closingTime: "" },
  });

  // États pour le cropper d'images
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropMode, setCropMode] = useState<"logo" | "cover" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  async function copyToClipboard(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch {
      throw new Error("Impossible de copier le lien");
    }
  }

  async function downloadQrCode() {
    if (!qrCodeDataUrl) {
      throw new Error("QR code non disponible");
    }

    const response = await fetch(qrCodeDataUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `${normalizedSlug || "boutique"}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  useEffect(() => {
    void loadShop();
  }, []);

  const normalizedSlug = useMemo(() => {
    return form.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, [form.slug]);

  const shopPreview = useMemo(() => {
    if (!normalizedSlug) {
      return "/shop/mon-aventure";
    }

    return `/shop/${normalizedSlug}`;
  }, [normalizedSlug]);

  const publicDomain = useMemo(() => {
    if (!normalizedSlug) {
      return "monaventure.bizmanager.shop";
    }

    return `${normalizedSlug}.bizmanager.shop`;
  }, [normalizedSlug]);

  useEffect(() => {
    const publicUrl = normalizedSlug && typeof window !== "undefined"
      ? `${window.location.origin}/shop/${normalizedSlug}`
      : "";

    if (!publicUrl) {
      setQrCodeDataUrl("");
      return;
    }

    void QRCode.toDataURL(publicUrl, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    }).then(setQrCodeDataUrl).catch(() => setQrCodeDataUrl(""));
  }, [normalizedSlug]);

  async function loadShop() {
    setUIState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/shop", { cache: "no-store" });
      const raw = await response.text();
      const json = parseJsonSafe<{ data?: Shop | null; error?: string }>(raw) ?? {};

      if (!response.ok) {
        throw new Error(json.error ?? "Impossible de charger la boutique");
      }

      const shop = json.data ?? null;

      if (!shop) {
        setForm(initialState);
        setPhone({ dialCode: "+237", localNumber: "" });
        setHours({
          monday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
          tuesday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
          wednesday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
          thursday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
          friday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
          saturday: { isOpen: true, openingTime: "08:00", closingTime: "18:00" },
          sunday: { isOpen: false, openingTime: "", closingTime: "" },
        });
      } else {
        const phoneParts = splitPhoneNumber(shop.whatsappNumber);
        const openingHoursParts = splitOpeningHours(shop.openingHours);

        setForm({
          slug: shop.slug,
          name: shop.name,
          notificationEmail: shop.notificationEmail ?? "",
          logoUrl: shop.logoUrl ?? "",
          coverUrl: shop.coverUrl ?? "",
          description: shop.description ?? "",
          address: shop.address ?? "",
          city: shop.city ?? "",
          postalCode: shop.postalCode ?? "",
          regionCountry: shop.regionCountry ?? "",
          whatsappNumber: shop.whatsappNumber,
          category: shop.category ?? "",
          openingHours: shop.openingHours ?? "",
          isPublished: shop.isPublished,
        });

        setPhone(phoneParts);
        setHours(openingHoursParts);
      }
    } catch (loadError) {
      setUIState(prev => ({
        ...prev,
        error: loadError instanceof Error ? loadError.message : "Erreur de chargement"
      }));
    } finally {
      setUIState(prev => ({ ...prev, loading: false }));
    }
  }

  function openEditGeneralModal() {
    setEditForm(form);
    setEditPhone(phone);
    setEditGeneralOpen(true);
  }

  async function saveEditedGeneral() {
    setUIState(prev => ({ ...prev, saving: true, error: null }));

    try {
      const phoneNumber = `${editPhone.dialCode}${editPhone.localNumber}`;
      const response = await fetch("/api/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editForm.slug,
          name: editForm.name,
          notificationEmail: editForm.notificationEmail,
          address: editForm.address,
          city: editForm.city,
          postalCode: editForm.postalCode,
          regionCountry: editForm.regionCountry,
          whatsappNumber: phoneNumber,
          category: editForm.category,
          description: editForm.description,
        }),
      });

      if (response.ok) {
        setForm(editForm);
        setPhone(editPhone);
        setEditGeneralOpen(false);
        setUIState(prev => ({
          ...prev,
          success: "Informations générales mises à jour"
        }));
        setTimeout(() => {
          setUIState(prev => ({ ...prev, success: null }));
        }, 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      setUIState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      }));
    } finally {
      setUIState(prev => ({ ...prev, saving: false }));
    }
  }

  function openEditHoursModal() {
    setEditHours(hours);
    setEditHoursOpen(true);
  }

  async function saveEditedHours() {
    setUIState(prev => ({ ...prev, saving: true, error: null }));

    try {
      const openingHoursJson = JSON.stringify(editHours);
      const response = await fetch("/api/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingHours: openingHoursJson,
        }),
      });

      if (response.ok) {
        setHours(editHours);
        setEditHoursOpen(false);
        setUIState(prev => ({
          ...prev,
          success: "Horaires d'ouverture mis à jour"
        }));
        setTimeout(() => {
          setUIState(prev => ({ ...prev, success: null }));
        }, 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      setUIState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      }));
    } finally {
      setUIState(prev => ({ ...prev, saving: false }));
    }
  }

  async function updateShopMedia(file: File, target: "logo" | "cover") {
    setUIState(prev => ({ ...prev, saving: true, error: null }));

    try {
      const formData = new FormData();
      const fallbackOpeningHours =
        hours.monday.isOpen && hours.monday.openingTime && hours.monday.closingTime
          ? `${hours.monday.openingTime}-${hours.monday.closingTime}`
          : "";

      formData.append("slug", form.slug);
      formData.append("name", form.name);
      formData.append("notificationEmail", form.notificationEmail);
      formData.append("logoUrl", form.logoUrl);
      formData.append("coverUrl", form.coverUrl);
      formData.append("description", form.description);
      formData.append("city", form.city);
      formData.append("postalCode", form.postalCode);
      formData.append("regionCountry", form.regionCountry);
      formData.append("whatsappNumber", `${phone.dialCode}${phone.localNumber}`);
      formData.append("category", form.category);
      formData.append("address", form.address);
      formData.append("openingHours", form.openingHours || fallbackOpeningHours);
      formData.append("isPublished", String(form.isPublished));

      if (target === "logo") {
        formData.append("logoFile", file);
      } else {
        formData.append("coverFile", file);
      }

      const response = await fetch("/api/shop", {
        method: "PUT",
        body: formData,
      });

      const raw = await response.text();
      const payload = parseJsonSafe<{ data?: Shop | null; error?: string }>(raw) ?? {};

      if (!response.ok) {
        throw new Error(payload.error ?? "Erreur lors de l'envoi de l'image");
      }

      const updatedShop = payload.data;

      if (updatedShop) {
        setForm({
          slug: updatedShop.slug,
          name: updatedShop.name,
          notificationEmail: updatedShop.notificationEmail ?? "",
          logoUrl: updatedShop.logoUrl ?? "",
          coverUrl: updatedShop.coverUrl ?? "",
          description: updatedShop.description ?? "",
          address: updatedShop.address ?? "",
          city: updatedShop.city ?? "",
          postalCode: updatedShop.postalCode ?? "",
          regionCountry: updatedShop.regionCountry ?? "",
          whatsappNumber: updatedShop.whatsappNumber,
          category: updatedShop.category ?? "",
          openingHours: updatedShop.openingHours ?? "",
          isPublished: updatedShop.isPublished,
        });
        setPhone(splitPhoneNumber(updatedShop.whatsappNumber));
        setHours(splitOpeningHours(updatedShop.openingHours));
      }

      setUIState(prev => ({
        ...prev,
        success: target === "logo" ? "Logo mis a jour" : "Banniere mise a jour",
      }));

      setTimeout(() => {
        setUIState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error) {
      setUIState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'image",
      }));
    } finally {
      setUIState(prev => ({ ...prev, saving: false }));
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>, target: "logo" | "cover") {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUIState(prev => ({ ...prev, error: "Le fichier doit etre une image" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUIState(prev => ({ ...prev, error: "Image trop lourde (max 5MB)" }));
      return;
    }

    // Ouvrir le cropper au lieu d'uploader directement
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviewUrl(e.target?.result as string);
      setSelectedFile(file);
      setCropMode(target);
      setCropZoom(1);
      setCropPosition({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  }

  function closeCropModal() {
    setCropModalOpen(false);
    setSelectedFile(null);
    setImagePreviewUrl("");
    setCropMode(null);
    setCropZoom(1);
    setCropPosition({ x: 0, y: 0 });
  }

  async function confirmCrop() {
    if (!selectedFile || !cropMode || !imagePreviewUrl) return;

    setUIState(prev => ({ ...prev, saving: true, error: null }));

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Impossible d'initialiser le canvas");

      const img = new Image();
      img.onload = async () => {
        // Déterminer les dimensions du crop
        const containerWidth = cropMode === "logo" ? 300 : 600;
        const containerHeight = cropMode === "logo" ? 300 : 150;

        // Calculer les dimensions du crop sur l'image originale
        const imageWidth = img.naturalWidth;
        const imageHeight = img.naturalHeight;

        // Appliquer le zoom et la position
        const scale = imageWidth / (containerWidth * (1 / cropZoom));
        const cropX = Math.max(0, -cropPosition.x * scale);
        const cropY = Math.max(0, -cropPosition.y * scale);
        const cropWidth = Math.min(imageWidth - cropX, containerWidth * scale);
        const cropHeight = Math.min(imageHeight - cropY, containerHeight * scale);

        // Définir la taille du canvas en fonction du target
        if (cropMode === "logo") {
          canvas.width = 300;
          canvas.height = 300;
        } else {
          canvas.width = 600;
          canvas.height = 150;
        }

        // Dessiner l'image croppée sur le canvas
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Convertir le canvas en blob
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error("Erreur lors de la création de l'image");

          const croppedFile = new File([blob], selectedFile.name, { type: "image/jpeg" });
          await updateShopMedia(croppedFile, cropMode);
          closeCropModal();
        }, "image/jpeg", 0.9);
      };
      img.src = imagePreviewUrl;
    } catch (error) {
      setUIState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur lors du crop",
        saving: false,
      }));
    }
  }

  if (uiState.loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-600">Chargement des paramètres...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher un produit, une commande, un client…"
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <svg className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-100">
              <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-2 top-2 inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="inline-flex items-center gap-2.5 rounded-full px-3 py-1.5 transition hover:bg-slate-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">MA</div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold text-slate-900">Mon Aventure</p>
                  <p className="text-xs text-slate-500">Marchand</p>
                </div>
                <svg className={`h-4 w-4 text-slate-600 transition ${profileDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
                  <a href="#profile" className="block rounded-t-xl px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">Mon profil</a>
                  <a href="#settings" className="block px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">Paramètres</a>
                  <a href="#help" className="block px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">Aide</a>
                  <form action="/api/auth/logout" method="post">
                    <button type="submit" className="w-full rounded-b-xl px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-slate-50">Déconnexion</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full" style={{ maxWidth: "calc(100% - 2rem)" }}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4 lg:mb-5">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Ma boutique</h1>
              <p className="mt-1 text-sm text-slate-500 sm:mt-2">Gérez votre vitrine en ligne et les informations de votre commerce</p>
            </div>
            <a href={shopPreview} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 lg:h-11">Voir ma boutique</a>
          </div>

          <div className="shop-kpi-grid grid gap-3 lg:gap-4">
            <article className="shop-kpi-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600">Visites de la boutique</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">5 842</p>
                  <p className="mt-1 text-xs text-slate-500">vs 7 derniers jours</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                  </svg>
                </span>
              </div>
            </article>

            <article className="shop-kpi-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600">Taux de conversion</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">3,6%</p>
                  <p className="mt-1 text-xs text-slate-500">vs 7 derniers jours</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5h16l-6 7v6l-4 1v-7L4 5z" />
                  </svg>
                </span>
              </div>
            </article>

            <article className="shop-kpi-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600">Produits publiés</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">318</p>
                  <p className="mt-1 text-xs text-slate-500">vs hier</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7.5V16.5L12 21l8-4.5V7.5" />
                  </svg>
                </span>
              </div>
            </article>

            <article className="shop-kpi-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600">Partages WhatsApp</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950">126</p>
                  <p className="mt-1 text-xs text-slate-500">vs 7 derniers jours</p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3a9 9 0 00-7.78 13.53L3 21l4.63-1.19A9 9 0 1012 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.5 8.8c.2-.5.5-.5.7-.5h.6c.2 0 .4.1.5.4l.8 2c.1.2.1.4 0 .6l-.5.8c.4.8 1.1 1.5 1.9 1.9l.8-.5c.2-.1.4-.1.6 0l2 .8c.3.1.4.3.4.5v.6c0 .2 0 .5-.5.7-.6.3-1.4.4-2.5 0-1.1-.4-2.5-1.2-3.6-2.3-1.1-1.1-1.9-2.5-2.3-3.6-.4-1.1-.3-1.9 0-2.5z" />
                  </svg>
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full" style={{ maxWidth: "calc(100% - 2rem)" }}>
          {uiState.error && <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{uiState.error}</div>}
          {uiState.success && <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">✓ {uiState.success}</div>}

          <div className="shop-body-grid grid gap-4">
            <div className="space-y-4">
              <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="group relative h-28 w-full overflow-hidden sm:h-32 lg:h-36">
                  {form.coverUrl ? (
                    <img src={form.coverUrl} alt="Bannière boutique" className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,#bbf7d0,#86efac_30%,#34d399_60%,#065f46)]" />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/35 via-slate-950/10 to-transparent" />
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-[1fr_170px]">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-base font-bold text-white shadow-sm">MA</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Mon Aventure</h2>
                          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Publiée</span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-600">{form.category || "Beauté & Bien-être"}</p>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Boutique vérifiée
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-700">{publicDomain}</span>
                          <button type="button" onClick={() => void navigator.clipboard.writeText(publicDomain)} className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 transition hover:bg-emerald-100" aria-label="Copier le lien public">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2" />
                              <rect x="8" y="8" width="12" height="12" rx="2" ry="2" strokeWidth={1.8} />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a href={shopPreview} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">Voir la boutique</a>
                    <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Partager</button>
                    <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">Modifier</button>
                  </div>
                </div>
              </article>

              <div className="grid gap-4 lg:grid-cols-2 lg:auto-rows-max">
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Informations générales</h3>
                    <button type="button" onClick={openEditGeneralModal} className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800">Modifier</button>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="flex items-center justify-between gap-2"><span className="text-slate-500">Nom de la boutique</span><span className="font-medium text-slate-800">{form.name || "Mon Aventure"}</span></p>
                    <p className="flex items-center justify-between gap-2"><span className="text-slate-500">Slug</span><span className="font-medium text-slate-800">{normalizedSlug || "mon-aventure"}</span></p>
                    <p className="flex items-center justify-between gap-2"><span className="text-slate-500">Téléphone</span><span className="font-medium text-slate-800">{phone.dialCode} {phone.localNumber || "000000000"}</span></p>
                    <p className="flex items-center justify-between gap-2"><span className="text-slate-500">Email</span><span className="truncate font-medium text-slate-800">{form.notificationEmail || "contact@monaventure.cm"}</span></p>
                    <p className="flex items-center justify-between gap-2"><span className="text-slate-500">Ville</span><span className="font-medium text-slate-800">{form.city || "Douala"}</span></p>
                    <p className="flex items-center justify-between gap-2"><span className="text-slate-500">Pays</span><span className="font-medium text-slate-800">{form.regionCountry || "Cameroun"}</span></p>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Horaires d&apos;ouverture</h3>
                    <button type="button" onClick={openEditHoursModal} className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800">Modifier</button>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => {
                      const dayLabel = { monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi", thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche" }[day];
                      const dayData = hours[day];
                      return (
                    <p key={day} className="flex justify-between">
                          <span>{dayLabel}</span>
                          <span className={dayData.isOpen ? "" : "font-semibold text-emerald-700"}>
                            {dayData.isOpen ? `${dayData.openingTime} - ${dayData.closingTime}` : "Fermé"}
                          </span>
                        </p>
                      );
                    })}
                  </div>
                </article>
              </div>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Moyens de paiement acceptés</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    "Orange Money",
                    "MTN Mobile Money",
                    "Espèces",
                    "Virement bancaire",
                  ].map((payment) => (
                    <span key={payment} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700">{payment}</span>
                  ))}
                </div>
              </article>

              <div className="grid gap-4 lg:grid-cols-2 lg:auto-rows-max">
                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">Performance récente</h3>
                    <select defaultValue="7d" className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600" aria-label="Filtre période performance">
                      <option value="7d">7 derniers jours</option>
                    </select>
                  </div>
                  <svg viewBox="0 0 560 220" className="h-auto w-full" role="img" aria-label="Graphique visites et commandes sur 7 jours">
                    <line x1="48" y1="20" x2="48" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="48" y1="180" x2="540" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                    <path d="M48 152 L126 138 L204 142 L282 118 L360 94 L438 82 L516 66" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M48 166 L126 160 L204 156 L282 150 L360 144 L438 136 L516 130" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" />
                    <text x="48" y="202" fontSize="11" fill="#64748b">12 mai</text>
                    <text x="126" y="202" fontSize="11" fill="#64748b">13 mai</text>
                    <text x="204" y="202" fontSize="11" fill="#64748b">14 mai</text>
                    <text x="282" y="202" fontSize="11" fill="#64748b">15 mai</text>
                    <text x="360" y="202" fontSize="11" fill="#64748b">16 mai</text>
                    <text x="438" y="202" fontSize="11" fill="#64748b">17 mai</text>
                    <text x="516" y="202" fontSize="11" fill="#64748b">18 mai</text>
                  </svg>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Conseils pour améliorer votre boutique</h3>
                  <div className="space-y-2">
                    {[
                      { title: "Ajoutez plus de produits", text: "Les boutiques avec plus de 20 produits reçoivent plus de visites." },
                      { title: "Activez les promos", text: "Attirez plus de clients avec des offres spéciales." },
                      { title: "Partagez sur WhatsApp", text: "Augmentez votre visibilité en un clic." },
                      { title: "Maintenez vos infos à jour", text: "Des informations complètes inspirent confiance." },
                    ].map((tip) => (
                      <div key={tip.title} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                        <p className="text-xs font-semibold text-slate-800">{tip.title}</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{tip.text}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </div>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:row-span-2" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Aperçu de la vitrine</h3>
              <div className="flex flex-1 items-center justify-center">
                <div className="mx-auto bg-slate-950" style={{ width: "240px", borderRadius: "2.5rem", borderWidth: "12px", borderStyle: "solid", borderColor: "#0f1724", boxShadow: "0 20px 60px rgba(15,23,42,0.20)" }}>
                  <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
                    <div className="absolute left-1/2 top-2.5 z-10 h-1.5 w-24 -translate-x-1/2 rounded-full bg-slate-300" />
                    
                    <div className="relative h-40 overflow-hidden">
                      {form.coverUrl ? <img src={form.coverUrl} alt="Aperçu couverture boutique" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_top,#bbf7d0,#86efac_35%,#34d399_65%,#065f46)]" />}
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/40 via-slate-950/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70">Boutique publique</p>
                        <p className="mt-1 text-xs font-bold text-white">{form.name || "Mon Aventure"}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">MA</div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">{form.name || "Mon Aventure"}</p>
                          <p className="text-[10px] text-slate-500">{form.category || "Beauté & Bien-être"}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700">Livraison rapide</p>
                            <p className="mt-0.5 text-[10px] font-semibold text-slate-700">Partout au Cameroun</p>
                          </div>
                          <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">Catégories</p>
                        <div className="mt-1.5 grid grid-cols-4 gap-1">
                          {["Soins", "Beauté", "Santé", "Bien-être"].map((cat) => (
                            <div key={cat} className="flex items-center justify-center rounded-lg bg-slate-50 py-1.5 text-[8px] font-semibold text-slate-600">
                              {cat}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">Nos meilleurs produits</p>
                        <div className="mt-1.5 grid grid-cols-2 gap-1">
                          {[
                            { name: "Serum Anti-âge", price: "18 500 FCFA" },
                            { name: "Creme Hydratante", price: "8 000 FCFA" }
                          ].map((prod) => (
                            <div key={prod.name} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <div className="h-12 w-full bg-linear-to-br from-orange-100 to-orange-50" />
                              <div className="px-1.5 py-1">
                                <p className="truncate text-[8px] font-semibold text-slate-700">{prod.name}</p>
                                <p className="text-[7px] font-bold text-emerald-700">{prod.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-[8px] font-bold text-white">Accueil</button>
                        <button className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[8px] font-bold text-slate-700">Catégories</button>
                        <button className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[8px] font-bold text-slate-700">Panier</button>
                        <button className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[8px] font-bold text-slate-700">Compte</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Personnalisation</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Thème de couleur</p>
                    <div className="mt-2 flex items-center gap-2">
                      {["bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-orange-500", "bg-rose-500", "bg-slate-700"].map((colorClass, index) => (
                        <span key={index} className={`h-6 w-6 rounded-full border border-white shadow-sm ${colorClass}`} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600">Logo de la boutique</p>
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="Logo boutique" className="h-10 w-10 rounded-full border border-slate-200 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{form.name ? form.name.slice(0, 1).toUpperCase() : "M"}</div>
                      )}
                      <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                        {uiState.saving ? "Envoi..." : "Changer"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uiState.saving}
                          onChange={(event) => void handleImageChange(event, "logo")}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600">Bannière de couverture</p>
                    <div className="mt-2 space-y-2">
                      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                        {form.coverUrl ? <img src={form.coverUrl} alt="Miniature de la bannière" className="h-20 w-full object-cover object-center" /> : <div className="h-20 w-full bg-linear-to-r from-emerald-100 via-slate-100 to-emerald-50" />}
                      </div>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                        {uiState.saving ? "Envoi..." : "Changer la banniere"}
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uiState.saving}
                          onChange={(event) => void handleImageChange(event, "cover")}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Statut de publication</p>
                      <p className="text-[11px] text-emerald-700">Votre boutique est en ligne</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((prev) => ({ ...prev, isPublished: event.target.checked }))} className="peer sr-only" />
                      <span className="h-6 w-11 rounded-full bg-emerald-500 transition peer-not-checked:bg-slate-300" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </label>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600">Dernière mise à jour</p>
                    <p className="mt-1 text-xs text-slate-500">1 mai 2026, 10:15</p>
                  </div>

                  <button type="button" className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Modifier l&apos;apparence</button>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Partage & QR Code</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Lien public de la boutique</p>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <input type="text" value={publicDomain} readOnly className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none" />
                      <button
                        type="button"
                        onClick={() => {
                          void copyToClipboard(publicDomain)
                            .then(() => setUIState((prev) => ({ ...prev, success: "Lien copié" })))
                            .catch((copyError) => setUIState((prev) => ({ ...prev, error: copyError instanceof Error ? copyError.message : "Impossible de copier le lien" })));
                        }}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Copier
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[92px_1fr] gap-2">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                      {qrCodeDataUrl ? (
                        <img src={qrCodeDataUrl} alt="QR code de la boutique" className="h-full w-full object-contain" />
                      ) : (
                        <div className="grid h-full w-full grid-cols-6 gap-1 p-1">
                          {Array.from({ length: 36 }).map((_, index) => (
                            <span key={index} className={`rounded-xs ${index % 4 === 0 || index % 7 === 0 ? "bg-slate-900" : "bg-slate-200"}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void copyToClipboard(`${window.location.origin}/shop/${normalizedSlug || "mon-aventure"}`)
                            .then(() => setUIState((prev) => ({ ...prev, success: "Lien public copié" })))
                            .catch((copyError) => setUIState((prev) => ({ ...prev, error: copyError instanceof Error ? copyError.message : "Impossible de copier le lien" })));
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Copier le lien
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void downloadQrCode().catch((downloadError) => setUIState((prev) => ({ ...prev, error: downloadError instanceof Error ? downloadError.message : "Impossible de télécharger le QR code" })));
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Télécharger le QR code
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] leading-4 text-slate-500">Partagez votre boutique avec vos clients sur WhatsApp, réseaux sociaux et plus encore.</p>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>

      {editGeneralOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="relative mx-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-950">Modifier les informations générales</h2>
              <button
                type="button"
                onClick={() => setEditGeneralOpen(false)}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Nom de la boutique</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Nom de la boutique"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Slug (URL)</label>
                <input
                  type="text"
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="mon-aventure"
                />
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Code pays</label>
                  <select
                    value={editPhone.dialCode}
                    onChange={(e) => setEditPhone({ ...editPhone, dialCode: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {AFRICAN_DIAL_CODES.map((code) => (
                      <option key={code.value} value={code.value}>{code.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Numéro de téléphone</label>
                  <input
                    type="tel"
                    value={editPhone.localNumber}
                    onChange={(e) => setEditPhone({ ...editPhone, localNumber: e.target.value.replace(/\D/g, "") })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="000000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Email de notification</label>
                <input
                  type="email"
                  value={editForm.notificationEmail}
                  onChange={(e) => setEditForm({ ...editForm, notificationEmail: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="contact@boutique.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Ville</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Douala"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Pays</label>
                  <input
                    type="text"
                    value={editForm.regionCountry}
                    onChange={(e) => setEditForm({ ...editForm, regionCountry: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Cameroun"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Adresse</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="123 Rue de la Paix"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">Code postal</label>
                <input
                  type="text"
                  value={editForm.postalCode}
                  onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="00000"
                />
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditGeneralOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={uiState.saving}
                  onClick={saveEditedGeneral}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uiState.saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editHoursOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-950">Modifier les horaires d&apos;ouverture</h2>
              <button
                type="button"
                onClick={() => setEditHoursOpen(false)}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Configurez les horaires d&apos;ouverture pour chaque jour</p>
              </div>

              <div className="space-y-3">

                {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => {
                  const dayLabel = { monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi", thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche" }[day];
                  const dayData = editHours[day];

                  return (
                    <div key={day} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={dayData.isOpen}
                            onChange={(e) =>
                              setEditHours({
                                ...editHours,
                                [day]: {
                                  ...dayData,
                                  isOpen: e.target.checked,
                                  openingTime: e.target.checked ? dayData.openingTime || "08:00" : "",
                                  closingTime: e.target.checked ? dayData.closingTime || "18:00" : "",
                                },
                              })
                            }
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-emerald-600"
                          />
                          <span className="text-sm font-semibold text-slate-800">{dayLabel}</span>
                        </label>
                      </div>

                      {dayData.isOpen && (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600">Ouverture</label>
                            <input
                              type="time"
                              value={dayData.openingTime}
                              onChange={(e) =>
                                setEditHours({
                                  ...editHours,
                                  [day]: { ...dayData, openingTime: e.target.value },
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600">Fermeture</label>
                            <input
                              type="time"
                              value={dayData.closingTime}
                              onChange={(e) =>
                                setEditHours({
                                  ...editHours,
                                  [day]: { ...dayData, closingTime: e.target.value },
                                })
                              }
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                        </div>
                      )}

                      {!dayData.isOpen && (
                        <p className="mt-2 text-xs font-semibold text-emerald-700">Fermé</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h4 className="mb-3 text-xs font-semibold text-slate-700">Résumé</h4>
                <div className="space-y-1 text-xs text-slate-600">
                  {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => {
                    const dayLabel = { monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi", thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche" }[day];
                    const dayData = editHours[day];
                    return (
                      <p key={day} className="flex justify-between">
                        <span className="font-medium text-slate-700">{dayLabel}</span>
                        <span>{dayData.isOpen ? `${dayData.openingTime} - ${dayData.closingTime}` : "Fermé"}</span>
                      </p>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditHoursOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={uiState.saving}
                  onClick={saveEditedHours}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uiState.saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-950">
                {cropMode === "logo" ? "Recadrer le logo" : "Recadrer la bannière"}
              </h2>
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Zone de prévisualisation du crop */}
              <div className="flex flex-col items-center gap-4">
                <div
                  className="relative w-full max-w-[720px] overflow-hidden rounded-xl border-2 border-emerald-300 bg-slate-100"
                  style={{
                    aspectRatio: cropMode === "logo" ? "1 / 1" : "4 / 1",
                  }}
                >
                  {imagePreviewUrl && (
                    <img
                      src={imagePreviewUrl}
                      alt="Aperçu du crop"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropZoom})`,
                        cursor: "grab",
                        transition: "transform 0.1s ease-out",
                      }}
                      draggable
                      onDragStart={(e) => {
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startPosX = cropPosition.x;
                        const startPosY = cropPosition.y;

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;
                          setCropPosition({
                            x: startPosX + deltaX,
                            y: startPosY + deltaY,
                          });
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener("mousemove", handleMouseMove);
                          document.removeEventListener("mouseup", handleMouseUp);
                        };

                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                    />
                  )}
                </div>

                {/* Contrôles */}
                <div className="w-full space-y-3">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-600">Zoom: {cropZoom.toFixed(1)}x</p>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={cropZoom}
                      onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setCropZoom(1);
                        setCropPosition({ x: 0, y: 0 });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Réinitialiser
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    Conseil: glissez l&apos;image pour la repositionner, puis ajustez le zoom pour un cadrage propre.
                  </p>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeCropModal}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={uiState.saving}
                  onClick={confirmCrop}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uiState.saving ? "Traitement..." : "Confirmer et uploader"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
