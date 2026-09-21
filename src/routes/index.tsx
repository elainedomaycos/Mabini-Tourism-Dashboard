import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  createContext,
  useContext,
  lazy,
  Suspense,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { z } from "zod";
import {
  Anchor,
  LayoutDashboard,
  Users,
  Building2,
  Receipt,
  FileImage,
  MapPin,
  BarChart3,
  FileBarChart,
  Megaphone,
  Settings,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  Download,
  Forward,
  Eye,
  Plus,
  Edit3,
  Trash2,
  Waves,
  ShieldCheck,
  Shield,
  Filter,
  TrendingUp,
  CreditCard,
  UserCheck,
  ScrollText,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  FileDown,
  FileText,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarIcon,
  SlidersHorizontal,
  ZoomIn,
  Mail,
  Clock,
  CalendarClock,
  Users2,
  Sun,
  Moon,
  Activity,
  UserCog,
  Lock,
  AlertTriangle,
  BellOff,
  ShieldAlert,
  Ban,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Pagination, usePagination } from "@/components/ui/pagination";
import type { DiveSiteHeatmap as DiveSiteHeatmapType } from "@/components/DiveSiteHeatmap";
import { RejectReasonDialog } from "@/components/RejectReasonDialog";
import { ReceiptLightbox } from "@/components/ReceiptLightbox";
import { ActionRequiredStrip } from "@/components/sections/ActionRequiredStrip";
import { DivePassOverview } from "@/components/sections/DivePassOverview";
import { Establishments } from "@/components/sections/Establishments";
import { TouristAnalytics } from "@/components/sections/TouristAnalytics";
import { DiveActivityAnalytics } from "@/components/sections/DiveActivityAnalytics";
import { DivePassAnalytics } from "@/components/sections/DivePassAnalytics";
import { EstablishmentAnalytics } from "@/components/sections/EstablishmentAnalytics";
import { EstablishmentsPage } from "@/components/sections/EstablishmentsPage";
import { DiveOpsPage } from "@/components/sections/DiveOpsPage";
import { DivePassPage } from "@/components/sections/DivePassPage";
import { AnalyticsPage } from "@/components/sections/AnalyticsPage";

/* ------------------------------ SEARCH PARAMS SCHEMA ------------------------------ */
const searchSchema = z.object({
  section: z
    .enum([
      "overview",
      "tourists",
      "establishments",
      "dive-ops",
      "dive-pass",
      "analytics",
      "announcements",
      "settings",
    ])
    .catch("overview")
    .default("overview"),
  q: z.string().default(""),
  status: z.string().default("All"),
  nationality: z.string().default("All"),
  level: z.string().default("All"),
  site: z.string().default("All"),
  difficulty: z.string().default("All"),
  siteType: z.string().default("All"),
  dateFrom: z.string().default(""),
  dateTo: z.string().default(""),
  tab: z.string().default(""),
  globalDateRange: z.enum(["today", "7d", "30d", "custom"]).default("30d"),
  globalDateFrom: z.string().default(""),
  globalDateTo: z.string().default(""),
});

type Section =
  | "overview"
  | "tourists"
  | "establishments"
  | "dive-ops"
  | "dive-pass"
  | "analytics"
  | "announcements"
  | "settings";

export const Route = createFileRoute("/")({
  component: App,
  validateSearch: (search: Record<string, unknown>) =>
    searchSchema.parse(search),
});

/* ------------------------------ MOCK DATA ------------------------------ */
const monthlyTrends = [
  { m: "Jan", tourists: 620, dives: 1140 },
  { m: "Feb", tourists: 750, dives: 1380 },
  { m: "Mar", tourists: 980, dives: 1790 },
  { m: "Apr", tourists: 1120, dives: 2040 },
  { m: "May", tourists: 1340, dives: 2430 },
  { m: "Jun", tourists: 1560, dives: 2850 },
  { m: "Jul", tourists: 1780, dives: 3240 },
  { m: "Aug", tourists: 1860, dives: 3380 },
  { m: "Sep", tourists: 1480, dives: 2690 },
  { m: "Oct", tourists: 1290, dives: 2340 },
  { m: "Nov", tourists: 1050, dives: 1920 },
  { m: "Dec", tourists: 1420, dives: 2580 },
];
const nationality = [
  { name: "USA", value: 38 },
  { name: "Germany", value: 22 },
  { name: "Japan", value: 20 },
  { name: "UK", value: 16 },
  { name: "Mexico", value: 12 },
  { name: "Other", value: 8 },
];
const diveLevel = [
  { name: "Open Water", value: 45 },
  { name: "Advanced", value: 28 },
  { name: "Rescue", value: 12 },
  { name: "Divemaster", value: 9 },
  { name: "Instructor", value: 6 },
];
const diveType = [
  { name: "Reef", value: 62 },
  { name: "Wreck", value: 18 },
  { name: "Drift", value: 12 },
  { name: "Night", value: 8 },
];
const topSites = [
  { name: "Blue Hole", value: 328 },
  { name: "Coral Gardens", value: 284 },
  { name: "Shark Point", value: 241 },
  { name: "Manta Reef", value: 197 },
  { name: "Turtle Bay", value: 168 },
];
const diveSites: {
  id: string;
  name: string;
  barangay: string;
  depth: string;
  difficulty: string;
  type: string;
  status: string;
  dives: number;
  description: string;
  photo: string;
  lat: number;
  lng: number;
}[] = [
  {
    id: "DS-001",
    name: "Blue Hole",
    barangay: "San Teodoro",
    depth: "12–40 m",
    difficulty: "Advanced",
    type: "Reef",
    status: "Active",
    dives: 328,
    description:
      "A dramatic vertical drop-off with rich coral walls and occasional thresher shark sightings.",
    photo: "",
    lat: 13.762,
    lng: 120.9245,
  },
  {
    id: "DS-002",
    name: "Coral Gardens",
    barangay: "Solo",
    depth: "5–25 m",
    difficulty: "Open Water",
    type: "Reef",
    status: "Active",
    dives: 284,
    description:
      "Shallow reef system ideal for beginners, featuring vast fields of staghorn and brain coral.",
    photo: "",
    lat: 13.751,
    lng: 120.918,
  },
  {
    id: "DS-003",
    name: "Shark Point",
    barangay: "San Teodoro",
    depth: "18–35 m",
    difficulty: "Advanced",
    type: "Reef",
    status: "Active",
    dives: 241,
    description:
      "A seamount known for whitetip reef sharks and large schools of jacks.",
    photo: "",
    lat: 13.768,
    lng: 120.931,
  },
  {
    id: "DS-004",
    name: "Manta Reef",
    barangay: "Batas",
    depth: "15–30 m",
    difficulty: "Rescue",
    type: "Reef",
    status: "Active",
    dives: 197,
    description:
      "Seasonal cleaning station where manta rays gather from November to April.",
    photo: "",
    lat: 13.745,
    lng: 120.935,
  },
  {
    id: "DS-005",
    name: "Turtle Bay",
    barangay: "Batas",
    depth: "8–18 m",
    difficulty: "Open Water",
    type: "Reef",
    status: "Active",
    dives: 168,
    description:
      "Calm bay with resident green and hawksbill sea turtles year-round.",
    photo: "",
    lat: 13.74,
    lng: 120.928,
  },
  {
    id: "DS-006",
    name: "Loyzaga Wreck",
    barangay: "San Joaquin",
    depth: "22–38 m",
    difficulty: "Advanced",
    type: "Wreck",
    status: "Active",
    dives: 142,
    description:
      "Sunken WWII patrol boat encrusted with soft corals and home to lionfish.",
    photo: "",
    lat: 13.735,
    lng: 120.942,
  },
  {
    id: "DS-007",
    name: "Sombrero Island Wall",
    barangay: "Batas",
    depth: "10–45 m",
    difficulty: "Divemaster",
    type: "Wall",
    status: "Active",
    dives: 135,
    description:
      "Sheer wall dive dropping to 45 meters with prolific nudibranch life.",
    photo: "",
    lat: 13.753,
    lng: 120.94,
  },
  {
    id: "DS-008",
    name: "Sepoc Point",
    barangay: "San Teodoro",
    depth: "5–20 m",
    difficulty: "Open Water",
    type: "Reef",
    status: "Active",
    dives: 118,
    description:
      "Shore-entry reef with a gentle slope, ideal for training and night dives.",
    photo: "",
    lat: 13.759,
    lng: 120.919,
  },
  {
    id: "DS-009",
    name: "Twin Rocks",
    barangay: "Solo",
    depth: "12–28 m",
    difficulty: "Advanced",
    type: "Reef",
    status: "Seasonal",
    dives: 96,
    description:
      "Two submerged pinnacles with strong currents — best dived October to December.",
    photo: "",
    lat: 13.748,
    lng: 120.912,
  },
  {
    id: "DS-010",
    name: "Maricaban Wreck",
    barangay: "San Joaquin",
    depth: "30–50 m",
    difficulty: "Divemaster",
    type: "Wreck",
    status: "Restricted",
    dives: 54,
    description:
      "Deep cargo vessel wreck; technical certification required. Rich in glassfish clouds.",
    photo: "",
    lat: 13.73,
    lng: 120.948,
  },
];
const tourists = [
  {
    id: "TR-10241",
    name: "Emma Larsen",
    nationality: "Sweden",
    flag: "🇸🇪",
    level: "Advanced",
    status: "Active",
    registered: "2026-07-10",
    expires: "2027-07-10",
  },
  {
    id: "TR-10242",
    name: "Kenji Watanabe",
    nationality: "Japan",
    flag: "🇯🇵",
    level: "Divemaster",
    status: "Active",
    registered: "2026-06-28",
    expires: "2027-06-28",
  },
  {
    id: "TR-10243",
    name: "Ana Ribeiro",
    nationality: "Brazil",
    flag: "🇧🇷",
    level: "Open Water",
    status: "Expired",
    registered: "2026-06-15",
    expires: "2026-06-15",
  },
  {
    id: "TR-10244",
    name: "Liam O'Connor",
    nationality: "Ireland",
    flag: "🇮🇪",
    level: "Rescue",
    status: "Active",
    registered: "2026-07-03",
    expires: "2027-07-03",
  },
  {
    id: "TR-10245",
    name: "Fatima Noor",
    nationality: "UAE",
    flag: "🇦🇪",
    level: "Advanced",
    status: "Suspended",
    registered: "2026-06-20",
    expires: "2027-06-20",
  },
  {
    id: "TR-10246",
    name: "Diego Alvarez",
    nationality: "Mexico",
    flag: "🇲🇽",
    level: "Instructor",
    status: "Active",
    registered: "2026-07-18",
    expires: "2028-07-18",
  },
  {
    id: "TR-10247",
    name: "Sophie Müller",
    nationality: "Germany",
    flag: "🇩🇪",
    level: "Advanced",
    status: "Active",
    registered: "2026-06-05",
    expires: "2027-06-05",
  },
  {
    id: "TR-10248",
    name: "James Whitfield",
    nationality: "USA",
    flag: "🇺🇸",
    level: "Open Water",
    status: "Active",
    registered: "2026-07-22",
    expires: "2027-07-22",
  },
  {
    id: "TR-10249",
    name: "Yuki Tanaka",
    nationality: "Japan",
    flag: "🇯🇵",
    level: "Rescue",
    status: "Expired",
    registered: "2026-06-12",
    expires: "2026-06-12",
  },
  {
    id: "TR-10250",
    name: "Olivia Chen",
    nationality: "USA",
    flag: "🇺🇸",
    level: "Advanced",
    status: "Active",
    registered: "2026-07-08",
    expires: "2027-07-08",
  },
  {
    id: "TR-10251",
    name: "Marco Rossi",
    nationality: "Italy",
    flag: "🇮🇹",
    level: "Instructor",
    status: "Active",
    registered: "2026-06-25",
    expires: "2028-06-25",
  },
  {
    id: "TR-10252",
    name: "Anya Petrova",
    nationality: "Russia",
    flag: "🇷🇺",
    level: "Open Water",
    status: "Suspended",
    registered: "2026-07-01",
    expires: "2027-07-01",
  },
  {
    id: "TR-10253",
    name: "Carlos Mendoza",
    nationality: "Mexico",
    flag: "🇲🇽",
    level: "Divemaster",
    status: "Active",
    registered: "2026-06-30",
    expires: "2027-06-30",
  },
  {
    id: "TR-10254",
    name: "Hannah Baker",
    nationality: "UK",
    flag: "🇬🇧",
    level: "Advanced",
    status: "Active",
    registered: "2026-07-15",
    expires: "2027-07-15",
  },
  {
    id: "TR-10255",
    name: "Raj Patel",
    nationality: "India",
    flag: "🇮🇳",
    level: "Open Water",
    status: "Active",
    registered: "2026-06-18",
    expires: "2027-06-18",
  },
  {
    id: "TR-10256",
    name: "Lena Johansson",
    nationality: "Sweden",
    flag: "🇸🇪",
    level: "Rescue",
    status: "Active",
    registered: "2026-07-20",
    expires: "2027-07-20",
  },
  {
    id: "TR-10257",
    name: "Takashi Yamamoto",
    nationality: "Japan",
    flag: "🇯🇵",
    level: "Advanced",
    status: "Active",
    registered: "2026-06-22",
    expires: "2027-06-22",
  },
  {
    id: "TR-10258",
    name: "Maria Santos",
    nationality: "Brazil",
    flag: "🇧🇷",
    level: "Instructor",
    status: "Active",
    registered: "2026-07-05",
    expires: "2028-07-05",
  },
  {
    id: "TR-10259",
    name: "Patrick Kelly",
    nationality: "Ireland",
    flag: "🇮🇪",
    level: "Open Water",
    status: "Active",
    registered: "2026-06-10",
    expires: "2027-06-10",
  },
  {
    id: "TR-10260",
    name: "Nadia Al-Rashid",
    nationality: "UAE",
    flag: "🇦🇪",
    level: "Advanced",
    status: "Active",
    registered: "2026-07-12",
    expires: "2027-07-12",
  },
  {
    id: "TR-10261",
    name: "Carlos Vega",
    nationality: "Mexico",
    flag: "🇲🇽",
    level: "Rescue",
    status: "Active",
    registered: "2026-06-08",
    expires: "2027-06-08",
  },
  {
    id: "TR-10262",
    name: "Anna Schmidt",
    nationality: "Germany",
    flag: "🇩🇪",
    level: "Open Water",
    status: "Active",
    registered: "2026-07-25",
    expires: "2027-07-25",
  },
  {
    id: "TR-10263",
    name: "Tom Richards",
    nationality: "USA",
    flag: "🇺🇸",
    level: "Divemaster",
    status: "Active",
    registered: "2026-06-14",
    expires: "2027-06-14",
  },
  {
    id: "TR-10264",
    name: "Haruto Suzuki",
    nationality: "Japan",
    flag: "🇯🇵",
    level: "Advanced",
    status: "Active",
    registered: "2026-07-02",
    expires: "2027-07-02",
  },
  {
    id: "TR-10265",
    name: "Isabella Conti",
    nationality: "Italy",
    flag: "🇮🇹",
    level: "Open Water",
    status: "Active",
    registered: "2026-06-27",
    expires: "2027-06-27",
  },
  {
    id: "TR-10266",
    name: "Viktor Petrov",
    nationality: "Russia",
    flag: "🇷🇺",
    level: "Instructor",
    status: "Active",
    registered: "2026-07-19",
    expires: "2028-07-19",
  },
  {
    id: "TR-10267",
    name: "Priya Sharma",
    nationality: "India",
    flag: "🇮🇳",
    level: "Advanced",
    status: "Active",
    registered: "2026-06-03",
    expires: "2027-06-03",
  },
  {
    id: "TR-10268",
    name: "Owen Davies",
    nationality: "UK",
    flag: "🇬🇧",
    level: "Rescue",
    status: "Active",
    registered: "2026-07-09",
    expires: "2027-07-09",
  },
  {
    id: "TR-10269",
    name: "Sofia Andersen",
    nationality: "Denmark",
    flag: "🇩🇰",
    level: "Open Water",
    status: "Active",
    registered: "2026-06-16",
    expires: "2027-06-16",
  },
  {
    id: "TR-10270",
    name: "David Kim",
    nationality: "USA",
    flag: "🇺🇸",
    level: "Advanced",
    status: "Active",
    registered: "2026-07-24",
    expires: "2027-07-24",
  },
];
const operatorApps: Array<{
  id: string;
  name: string;
  owner: string;
  submitted: string;
  status: string;
  rejectReason?: string;
}> = [
  {
    id: "OP-2201",
    name: "Deep Blue Charters",
    owner: "M. Kalua",
    submitted: "2026-07-18",
    status: "Pending",
  },
  {
    id: "OP-2202",
    name: "Reef Riders Co.",
    owner: "S. Nakamura",
    submitted: "2026-07-10",
    status: "Pending",
  },
  {
    id: "OP-2203",
    name: "Coral Coast Divers",
    owner: "P. Mendez",
    submitted: "2026-06-28",
    status: "Approved",
  },
  {
    id: "OP-2204",
    name: "Manta Expeditions",
    owner: "L. Petersen",
    submitted: "2026-06-22",
    status: "Rejected",
  },
  {
    id: "OP-2205",
    name: "Turtle Bay Dive Shop",
    owner: "R. Santos",
    submitted: "2026-07-05",
    status: "Approved",
  },
  {
    id: "OP-2206",
    name: "Aqua Ventures PH",
    owner: "J. Dela Cruz",
    submitted: "2026-06-15",
    status: "Pending",
  },
  {
    id: "OP-2207",
    name: "Bluefin Divers",
    owner: "T. Schmidt",
    submitted: "2026-07-20",
    status: "Approved",
  },
  {
    id: "OP-2208",
    name: "Ocean Spirit Tours",
    owner: "K. Reyes",
    submitted: "2026-06-10",
    status: "Rejected",
  },
  {
    id: "OP-2209",
    name: "Coral Breeze Charters",
    owner: "L. Tran",
    submitted: "2026-07-08",
    status: "Pending",
  },
  {
    id: "OP-2210",
    name: "Sunset Divers PH",
    owner: "A. Ramos",
    submitted: "2026-06-20",
    status: "Approved",
  },
  {
    id: "OP-2211",
    name: "Blue Lagoon Tours",
    owner: "F. De Leon",
    submitted: "2026-07-14",
    status: "Pending",
  },
  {
    id: "OP-2212",
    name: "Deep Six Charters",
    owner: "R. Villanueva",
    submitted: "2026-06-05",
    status: "Approved",
  },
  {
    id: "OP-2213",
    name: "Aquatech Dive Co.",
    owner: "M. Tan",
    submitted: "2026-07-01",
    status: "Rejected",
  },
  {
    id: "OP-2214",
    name: "Wavecrest Adventures",
    owner: "D. Cruz",
    submitted: "2026-06-18",
    status: "Pending",
  },
  {
    id: "OP-2215",
    name: "Nautilus Expeditions",
    owner: "S. Bautista",
    submitted: "2026-07-22",
    status: "Approved",
  },
  {
    id: "OP-2216",
    name: "Coral Kingdom Tours",
    owner: "J. Garcia",
    submitted: "2026-06-12",
    status: "Rejected",
  },
];
const receipts: Array<{
  id: string;
  operator: string;
  ref: string;
  amount: string;
  date: string;
  status: string;
  rejectReason?: string;
}> = [
  {
    id: "RC-88431",
    operator: "Deep Blue Charters",
    ref: "BNK-9948721",
    amount: "$1,240.00",
    date: "2026-07-22",
    status: "Pending",
  },
  {
    id: "RC-88432",
    operator: "Reef Riders Co.",
    ref: "BNK-9948810",
    amount: "$860.00",
    date: "2026-07-15",
    status: "Pending",
  },
  {
    id: "RC-88433",
    operator: "Coral Coast Divers",
    ref: "BNK-9948855",
    amount: "$2,410.00",
    date: "2026-06-28",
    status: "Pending",
  },
  {
    id: "RC-88434",
    operator: "Turtle Bay Dive Shop",
    ref: "BNK-9948901",
    amount: "$540.00",
    date: "2026-07-08",
    status: "Approved",
  },
  {
    id: "RC-88435",
    operator: "Deep Blue Charters",
    ref: "BNK-9948950",
    amount: "$3,100.00",
    date: "2026-06-20",
    status: "Approved",
  },
  {
    id: "RC-88436",
    operator: "Manta Expeditions",
    ref: "BNK-9949001",
    amount: "$1,780.00",
    date: "2026-07-18",
    status: "Rejected",
  },
  {
    id: "RC-88437",
    operator: "Aqua Ventures PH",
    ref: "BNK-9949050",
    amount: "$920.00",
    date: "2026-06-12",
    status: "Pending",
  },
  {
    id: "RC-88438",
    operator: "Bluefin Divers",
    ref: "BNK-9949102",
    amount: "$1,560.00",
    date: "2026-07-24",
    status: "Pending",
  },
  {
    id: "RC-88439",
    operator: "Reef Riders Co.",
    ref: "BNK-9949155",
    amount: "$2,080.00",
    date: "2026-06-18",
    status: "Approved",
  },
  {
    id: "RC-88440",
    operator: "Coral Coast Divers",
    ref: "BNK-9949201",
    amount: "$720.00",
    date: "2026-07-02",
    status: "Approved",
  },
  {
    id: "RC-88441",
    operator: "Turtle Bay Dive Shop",
    ref: "BNK-9949250",
    amount: "$1,890.00",
    date: "2026-06-25",
    status: "Pending",
  },
  {
    id: "RC-88442",
    operator: "Deep Blue Charters",
    ref: "BNK-9949301",
    amount: "$3,420.00",
    date: "2026-07-10",
    status: "Approved",
  },
  {
    id: "RC-88443",
    operator: "Manta Expeditions",
    ref: "BNK-9949355",
    amount: "$680.00",
    date: "2026-06-08",
    status: "Rejected",
  },
  {
    id: "RC-88444",
    operator: "Bluefin Divers",
    ref: "BNK-9949401",
    amount: "$1,350.00",
    date: "2026-07-16",
    status: "Pending",
  },
  {
    id: "RC-88445",
    operator: "Reef Riders Co.",
    ref: "BNK-9949450",
    amount: "$2,740.00",
    date: "2026-06-30",
    status: "Approved",
  },
  {
    id: "RC-88446",
    operator: "Coral Coast Divers",
    ref: "BNK-9949501",
    amount: "$950.00",
    date: "2026-07-06",
    status: "Pending",
  },
  {
    id: "RC-88447",
    operator: "Aqua Ventures PH",
    ref: "BNK-9949555",
    amount: "$1,120.00",
    date: "2026-06-14",
    status: "Approved",
  },
];
const manifestos = [
  {
    id: "MF-55021",
    operator: "Deep Blue Charters",
    site: "Blue Hole",
    divers: 8,
    date: "2026-07-22",
  },
  {
    id: "MF-55022",
    operator: "Reef Riders Co.",
    site: "Coral Gardens",
    divers: 6,
    date: "2026-07-15",
  },
  {
    id: "MF-55023",
    operator: "Coral Coast Divers",
    site: "Shark Point",
    divers: 10,
    date: "2026-06-29",
  },
  {
    id: "MF-55024",
    operator: "Manta Expeditions",
    site: "Manta Reef",
    divers: 12,
    date: "2026-07-03",
  },
  {
    id: "MF-55025",
    operator: "Turtle Bay Dive Shop",
    site: "Turtle Bay",
    divers: 5,
    date: "2026-06-22",
  },
  {
    id: "MF-55026",
    operator: "Deep Blue Charters",
    site: "Shark Point",
    divers: 7,
    date: "2026-07-18",
  },
  {
    id: "MF-55027",
    operator: "Bluefin Divers",
    site: "Blue Hole",
    divers: 9,
    date: "2026-06-15",
  },
  {
    id: "MF-55028",
    operator: "Reef Riders Co.",
    site: "Manta Reef",
    divers: 4,
    date: "2026-07-08",
  },
  {
    id: "MF-55029",
    operator: "Aqua Ventures PH",
    site: "Coral Gardens",
    divers: 11,
    date: "2026-06-25",
  },
  {
    id: "MF-55030",
    operator: "Coral Coast Divers",
    site: "Turtle Bay",
    divers: 6,
    date: "2026-07-12",
  },
  {
    id: "MF-55031",
    operator: "Deep Blue Charters",
    site: "Manta Reef",
    divers: 10,
    date: "2026-07-24",
  },
  {
    id: "MF-55032",
    operator: "Manta Expeditions",
    site: "Blue Hole",
    divers: 8,
    date: "2026-06-20",
  },
  {
    id: "MF-55033",
    operator: "Reef Riders Co.",
    site: "Shark Point",
    divers: 6,
    date: "2026-07-01",
  },
  {
    id: "MF-55034",
    operator: "Turtle Bay Dive Shop",
    site: "Coral Gardens",
    divers: 4,
    date: "2026-06-10",
  },
  {
    id: "MF-55035",
    operator: "Coral Coast Divers",
    site: "Manta Reef",
    divers: 9,
    date: "2026-07-20",
  },
  {
    id: "MF-55036",
    operator: "Bluefin Divers",
    site: "Turtle Bay",
    divers: 7,
    date: "2026-06-08",
  },
  {
    id: "MF-55037",
    operator: "Aqua Ventures PH",
    site: "Shark Point",
    divers: 11,
    date: "2026-07-06",
  },
  {
    id: "MF-55038",
    operator: "Deep Blue Charters",
    site: "Coral Gardens",
    divers: 5,
    date: "2026-06-28",
  },
  {
    id: "MF-55039",
    operator: "Manta Expeditions",
    site: "Turtle Bay",
    divers: 13,
    date: "2026-07-16",
  },
  {
    id: "MF-55040",
    operator: "Reef Riders Co.",
    site: "Blue Hole",
    divers: 8,
    date: "2026-06-05",
  },
  {
    id: "MF-55041",
    operator: "Coral Coast Divers",
    site: "Manta Reef",
    divers: 6,
    date: "2026-07-25",
  },
  {
    id: "MF-55042",
    operator: "Turtle Bay Dive Shop",
    site: "Shark Point",
    divers: 5,
    date: "2026-06-18",
  },
  {
    id: "MF-55043",
    operator: "Bluefin Divers",
    site: "Coral Gardens",
    divers: 10,
    date: "2026-07-14",
  },
  {
    id: "MF-55044",
    operator: "Deep Blue Charters",
    site: "Turtle Bay",
    divers: 7,
    date: "2026-06-12",
  },
  {
    id: "MF-55045",
    operator: "Aqua Ventures PH",
    site: "Blue Hole",
    divers: 9,
    date: "2026-07-10",
  },
];
const operatorActivity = [
  { name: "Deep Blue", manifestos: 128, credits: 2400 },
  { name: "Reef Riders", manifestos: 98, credits: 1860 },
  { name: "Coral Coast", manifestos: 84, credits: 1620 },
  { name: "Manta Expeditions", manifestos: 71, credits: 1440 },
  { name: "Turtle Divers", manifestos: 56, credits: 1080 },
  { name: "Bluefin Divers", manifestos: 45, credits: 920 },
  { name: "Aqua Ventures", manifestos: 38, credits: 780 },
  { name: "Nautilus Exp.", manifestos: 29, credits: 600 },
];
const auditLogs = [
  {
    date: "2026-07-25",
    t: "10:24",
    who: "admin@reef.gov",
    action: "Approved operator OP-2203",
  },
  {
    date: "2026-07-25",
    t: "09:58",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88429",
  },
  {
    date: "2026-07-25",
    t: "09:31",
    who: "admin@reef.gov",
    action: "Pushed announcement #A-014",
  },
  {
    date: "2026-07-25",
    t: "08:47",
    who: "clerk@reef.gov",
    action: "Suspended tourist TR-10245",
  },
  {
    date: "2026-07-24",
    t: "17:12",
    who: "admin@reef.gov",
    action: "Approved operator OP-2205",
  },
  {
    date: "2026-07-24",
    t: "16:45",
    who: "officer@reef.gov",
    action: "Generated monthly report",
  },
  {
    date: "2026-07-24",
    t: "14:30",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88425",
  },
  {
    date: "2026-07-24",
    t: "11:20",
    who: "admin@reef.gov",
    action: "Rejected operator OP-2204",
  },
  {
    date: "2026-07-23",
    t: "16:05",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88420",
  },
  {
    date: "2026-07-23",
    t: "14:18",
    who: "officer@reef.gov",
    action: "Added dive site DS-009",
  },
  {
    date: "2026-07-23",
    t: "10:42",
    who: "admin@reef.gov",
    action: "Approved operator OP-2207",
  },
  {
    date: "2026-07-22",
    t: "15:33",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88415",
  },
  {
    date: "2026-07-22",
    t: "13:10",
    who: "admin@reef.gov",
    action: "Pushed announcement #A-013",
  },
  {
    date: "2026-07-22",
    t: "09:55",
    who: "officer@reef.gov",
    action: "Registered tourist TR-10254",
  },
  {
    date: "2026-07-21",
    t: "16:40",
    who: "admin@reef.gov",
    action: "Approved operator OP-2206",
  },
  {
    date: "2026-07-21",
    t: "14:22",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88410",
  },
  {
    date: "2026-07-21",
    t: "11:05",
    who: "officer@reef.gov",
    action: "Suspended tourist TR-10252",
  },
  {
    date: "2026-07-20",
    t: "17:30",
    who: "admin@reef.gov",
    action: "Reverted receipt RC-88408",
  },
  {
    date: "2026-07-20",
    t: "15:15",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88405",
  },
  {
    date: "2026-07-20",
    t: "10:20",
    who: "admin@reef.gov",
    action: "Updated system config: 2FA required",
  },
  {
    date: "2026-07-19",
    t: "16:15",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88400",
  },
  {
    date: "2026-07-19",
    t: "13:40",
    who: "admin@reef.gov",
    action: "Approved operator OP-2209",
  },
  {
    date: "2026-07-18",
    t: "17:05",
    who: "officer@reef.gov",
    action: "Registered tourist TR-10260",
  },
  {
    date: "2026-07-18",
    t: "14:50",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88395",
  },
  {
    date: "2026-07-18",
    t: "11:30",
    who: "admin@reef.gov",
    action: "Rejected operator OP-2213",
  },
  {
    date: "2026-07-17",
    t: "16:20",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88390",
  },
  {
    date: "2026-07-17",
    t: "13:15",
    who: "admin@reef.gov",
    action: "Approved operator OP-2210",
  },
  {
    date: "2026-07-17",
    t: "10:45",
    who: "officer@reef.gov",
    action: "Pushed announcement #A-012",
  },
  {
    date: "2026-07-16",
    t: "17:30",
    who: "admin@reef.gov",
    action: "Suspended tourist TR-10268",
  },
  {
    date: "2026-07-16",
    t: "14:10",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88385",
  },
  {
    date: "2026-07-15",
    t: "16:50",
    who: "admin@reef.gov",
    action: "Approved operator OP-2212",
  },
  {
    date: "2026-07-15",
    t: "13:30",
    who: "officer@reef.gov",
    action: "Registered tourist TR-10265",
  },
  {
    date: "2026-07-15",
    t: "10:15",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88380",
  },
  {
    date: "2026-07-14",
    t: "17:00",
    who: "admin@reef.gov",
    action: "Rejected operator OP-2216",
  },
  {
    date: "2026-07-14",
    t: "14:25",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88375",
  },
  {
    date: "2026-07-14",
    t: "11:40",
    who: "officer@reef.gov",
    action: "Added dive site DS-010",
  },
  {
    date: "2026-07-13",
    t: "16:35",
    who: "admin@reef.gov",
    action: "Approved operator OP-2215",
  },
  {
    date: "2026-07-13",
    t: "13:20",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88370",
  },
  {
    date: "2026-07-12",
    t: "17:10",
    who: "officer@reef.gov",
    action: "Registered tourist TR-10258",
  },
  {
    date: "2026-07-12",
    t: "14:55",
    who: "admin@reef.gov",
    action: "Pushed announcement #A-011",
  },
  {
    date: "2026-07-12",
    t: "11:05",
    who: "clerk@reef.gov",
    action: "Verified receipt RC-88365",
  },
];

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "oklch(0.85 0.05 250)",
];

type AuditEntry = { date: string; t: string; who: string; action: string };

const liveAuditLogs: AuditEntry[] = [...auditLogs];
const auditLogListeners = new Set<() => void>();
function pushAuditLog(action: string) {
  const now = new Date();
  liveAuditLogs.unshift({
    date: now.toISOString().slice(0, 10),
    t: now.toTimeString().slice(0, 5),
    who: "admin@reef.gov",
    action,
  });
  auditLogListeners.forEach((fn) => fn());
}
function useLiveAuditLogs() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    auditLogListeners.add(fn);
    return () => {
      auditLogListeners.delete(fn);
    };
  }, []);
  return liveAuditLogs;
}

const AUDIT_TYPES = [
  "All",
  "Approval",
  "Rejection",
  "Verification",
  "Announcement",
  "Forward",
  "Tourist",
  "Dive Site",
  "Report",
  "Config",
  "Revert",
  "Other",
];
function auditActionType(action: string): string {
  if (action.includes("Approved")) return "Approval";
  if (action.includes("Rejected")) return "Rejection";
  if (action.includes("Verified")) return "Verification";
  if (action.includes("Forwarded") || action.includes("Downloaded"))
    return "Forward";
  if (action.includes("Reverted")) return "Revert";
  if (action.includes("Pushed") || action.includes("announcement"))
    return "Announcement";
  if (action.includes("Suspended") || action.includes("Registered tourist"))
    return "Tourist";
  if (action.includes("Added dive site")) return "Dive Site";
  if (action.includes("Generated")) return "Report";
  if (action.includes("Updated system")) return "Config";
  return "Other";
}

const ALL_NATIONALITIES = [
  ...new Set(tourists.map((t) => t.nationality)),
].sort();
const ALL_LEVELS = [...new Set(tourists.map((t) => t.level))].sort();
const ALL_SITES = [...new Set(manifestos.map((m) => m.site))].sort();
const ALL_OPERATOR_NAMES = [...new Set(receipts.map((r) => r.operator))].sort();
const ALL_OPERATOR_BIZ = [...new Set(operatorApps.map((a) => a.name))].sort();
const FORWARD_RECIPIENTS = [
  ...ALL_OPERATOR_BIZ.map((n) => ({
    name: n,
    email: `${n
      .toLowerCase()
      .replace(/[^a-z]+/g, "")
      .slice(0, 12)}@marine.gov.ph`,
  })),
  { name: "Bantay Dagat HQ", email: "hq@bantaydagat.gov.ph" },
  { name: "Tourism Office — Batangas", email: "tourism@batangas.gov.ph" },
];
const ALL_DIFFICULTIES = [
  ...new Set(diveSites.map((s) => s.difficulty)),
].sort();
const ALL_SITE_TYPES = [...new Set(diveSites.map((s) => s.type))].sort();
const ALL_BARANGAYS = [...new Set(diveSites.map((s) => s.barangay))].sort();

/* ------------------------------ URL HELPERS ------------------------------ */
export function useFilters() {
  const navigate = useNavigate({ from: "/" });
  const search = Route.useSearch();

  const setFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      navigate({
        search: (prev) => ({ ...prev, ...updates }),
        replace: true,
      });
    },
    [navigate],
  );

  const resetFilters = useCallback(() => {
    navigate({
      search: {
        section: search.section,
        q: "",
        status: "All",
        nationality: "All",
        level: "All",
        site: "All",
        difficulty: "All",
        siteType: "All",
        dateFrom: "",
        dateTo: "",
        tab: "",
        globalDateRange: "30d",
        globalDateFrom: "",
        globalDateTo: "",
      },
      replace: true,
    });
  }, [navigate, search.section]);

  return { search, setFilters, resetFilters };
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function useGlobalDateRange() {
  const { search, setFilters } = useFilters();
  const range = search.globalDateRange;
  const curMonthIdx = 6;

  let fromMonthIdx: number;
  let toMonthIdx: number;
  if (range === "today") {
    fromMonthIdx = curMonthIdx;
    toMonthIdx = curMonthIdx;
  } else if (range === "7d") {
    fromMonthIdx = Math.max(0, curMonthIdx - 1);
    toMonthIdx = curMonthIdx;
  } else if (range === "30d") {
    fromMonthIdx = Math.max(0, curMonthIdx - 2);
    toMonthIdx = curMonthIdx;
  } else {
    const fi = search.globalDateFrom
      ? new Date(search.globalDateFrom).getMonth()
      : 0;
    const ti = search.globalDateTo
      ? new Date(search.globalDateTo).getMonth()
      : curMonthIdx;
    fromMonthIdx = fi;
    toMonthIdx = ti;
  }

  const visibleMonths = useMemo(
    () => MONTHS.filter((_, i) => i >= fromMonthIdx && i <= toMonthIdx),
    [fromMonthIdx, toMonthIdx],
  );
  const scale = useMemo(
    () => (toMonthIdx - fromMonthIdx + 1) / 12,
    [fromMonthIdx, toMonthIdx],
  );
  const setRange = useCallback(
    (r: string, from?: string, to?: string) => {
      setFilters({
        globalDateRange: r,
        globalDateFrom: from ?? "",
        globalDateTo: to ?? "",
      });
    },
    [setFilters],
  );

  return {
    range,
    visibleMonths,
    scale,
    fromMonthIdx,
    toMonthIdx,
    setRange,
    globalDateFrom: search.globalDateFrom,
    globalDateTo: search.globalDateTo,
  };
}

/* ------------------------------ PLATFORM FEATURES ------------------------------ */
type Role = "superadmin" | "reviewer" | "readonly";
const ROLE_META: Record<
  Role,
  { label: string; desc: string; className: string; icon: any }
> = {
  superadmin: {
    label: "Super Admin",
    desc: "Full access — manage users, config & content",
    className: "bg-primary/15 text-primary border-primary/30",
    icon: ShieldCheck,
  },
  reviewer: {
    label: "Reviewer",
    desc: "Review & approve receipts, applications, manifestos",
    className: "bg-warning/15 text-warning border-warning/30",
    icon: UserCog,
  },
  readonly: {
    label: "Read-only",
    desc: "View data — no changes allowed",
    className: "bg-muted text-muted-foreground border-border",
    icon: Lock,
  },
};
const RoleContext = createContext<{
  role: Role;
  setRole: (r: Role) => void;
  canAct: boolean;
  canAdmin: boolean;
}>({ role: "superadmin", setRole: () => {}, canAct: true, canAdmin: true });

function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("superadmin");
  useEffect(() => {
    const saved = localStorage.getItem("dive-dashboard-role") as Role | null;
    if (saved && ROLE_META[saved]) setRoleState(saved);
  }, []);
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem("dive-dashboard-role", r);
    toast.success(`Switched to ${ROLE_META[r].label} view`, {
      description: ROLE_META[r].desc,
    });
  }, []);
  const value = useMemo(
    () => ({
      role,
      setRole,
      canAct: role !== "readonly",
      canAdmin: role === "superadmin",
    }),
    [role, setRole],
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
function useRole() {
  return useContext(RoleContext);
}
function usePermission() {
  const { canAct, canAdmin } = useRole();
  const deny = useCallback(
    (
      msg = "Read-only view — this action is locked. Switch to Super Admin or Reviewer to make changes.",
    ) => {
      toast.error("Action locked", { description: msg });
    },
    [],
  );
  return { canAct, canAdmin, deny };
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = localStorage.getItem("dive-dashboard-theme");
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("dive-dashboard-theme", next);
      return next;
    });
  }, []);
  return { theme, toggle };
}

type NotifKind = "receipt" | "application" | "manifesto" | "announcement";
type Notif = {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  section: string;
  at: string;
  read: boolean;
};
const NOTIF_ICONS: Record<NotifKind, any> = {
  receipt: Receipt,
  application: Building2,
  manifesto: FileImage,
  announcement: Megaphone,
};

const notifStore: { list: Notif[] } = {
  list: [
    ...receipts
      .filter((r) => r.status === "Pending")
      .map((r) => ({
        id: `rc-${r.id}`,
        kind: "receipt" as const,
        title: `Receipt ${r.id}`,
        detail: `${r.operator} · ${r.amount}`,
        section: "receipts",
        at: r.date,
        read: false,
      })),
    ...operatorApps
      .filter((a) => a.status === "Pending")
      .map((a) => ({
        id: `op-${a.id}`,
        kind: "application" as const,
        title: `Application ${a.id}`,
        detail: a.name,
        section: "operators",
        at: a.submitted,
        read: false,
      })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)),
};
const notifListeners = new Set<() => void>();
function notifyNotifs() {
  notifListeners.forEach((fn) => fn());
}
function pushNotif(n: Omit<Notif, "read">) {
  notifStore.list = [{ ...n, read: false }, ...notifStore.list];
  notifyNotifs();
}
function markNotifRead(id: string) {
  notifStore.list = notifStore.list.map((x) =>
    x.id === id ? { ...x, read: true } : x,
  );
  notifyNotifs();
}
function markAllNotifsRead() {
  notifStore.list = notifStore.list.map((x) => ({ ...x, read: true }));
  notifyNotifs();
}
function useNotifications() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    notifListeners.add(fn);
    return () => {
      notifListeners.delete(fn);
    };
  }, []);
  return {
    notifs: notifStore.list,
    unread: notifStore.list.filter((n) => !n.read).length,
  };
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

const DiveSiteHeatmapLazy = lazy(() =>
  import("@/components/DiveSiteHeatmap").then((m) => ({
    default: m.DiveSiteHeatmap,
  })),
);

function ClientOnlyDiveSiteHeatmap({
  sites,
}: {
  sites: React.ComponentProps<typeof DiveSiteHeatmapType>["sites"];
}) {
  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="h-[420px] w-full rounded-xl border border-border/60 bg-muted" />
    );
  }
  return (
    <Suspense
      fallback={
        <div className="h-[420px] w-full rounded-xl border border-border/60 bg-muted" />
      }
    >
      <DiveSiteHeatmapLazy sites={sites} />
    </Suspense>
  );
}

const SESSION_IDLE_MS = 60_000;
const SESSION_COUNTDOWN_S = 20;
function SessionGuard({ onExpire }: { onExpire: () => void }) {
  const [warn, setWarn] = useState(false);
  const [countdown, setCountdown] = useState(SESSION_COUNTDOWN_S);
  const lastActivity = useRef(Date.now());
  const warnRef = useRef(false);
  warnRef.current = warn;

  useEffect(() => {
    const bump = () => {
      lastActivity.current = Date.now();
      if (warnRef.current) setWarn(false);
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, bump));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (
        Date.now() - lastActivity.current >= SESSION_IDLE_MS &&
        !warnRef.current
      ) {
        setWarn(true);
        setCountdown(SESSION_COUNTDOWN_S);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!warn) return;
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(id);
          onExpire();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [warn, onExpire]);

  const stay = () => {
    lastActivity.current = Date.now();
    setWarn(false);
  };

  return (
    <Dialog
      open={warn}
      onOpenChange={(o) => {
        if (!o) stay();
      }}
    >
      <DialogContent className="max-w-md text-center">
        <div className="mx-auto size-14 rounded-2xl bg-warning/15 text-warning flex items-center justify-center">
          <AlertTriangle className="size-7" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Session about to expire
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            You've been idle for a while. For security, you'll be signed out in{" "}
            <span className="font-semibold text-foreground">{countdown}s</span>{" "}
            unless you keep working.
          </p>
        </DialogHeader>
        <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-warning rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${(countdown / SESSION_COUNTDOWN_S) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
        <DialogFooter className="mt-2 sm:justify-center">
          <Button variant="outline" onClick={onExpire} className="mr-2">
            Sign out
          </Button>
          <Button
            onClick={stay}
            className="gradient-primary text-primary-foreground"
          >
            <CheckCircle2 className="size-4 mr-1.5" /> Stay signed in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useCountUp(target: number, duration = 900) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return { ref, val };
}

function CountUp({ value, className }: { value: string; className?: string }) {
  const m = value.match(/[\d,]+/);
  if (!m) return <span className={className}>{value}</span>;
  const num = Number(m[0].replace(/,/g, ""));
  if (Number.isNaN(num)) return <span className={className}>{value}</span>;
  const prefix = value.slice(0, m.index);
  const suffix = value.slice((m.index ?? 0) + m[0].length);
  const { ref, val } = useCountUp(num);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

function PageTransition({
  section,
  children,
}: {
  section: string;
  children: ReactNode;
}) {
  const mounted = useMounted();
  if (!mounted) return <div>{children}</div>;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const mounted = useMounted();
  if (!mounted) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ APP ROOT ------------------------------ */
function App() {
  const [authed, setAuthed] = useState(false);
  return (
    <>
      <Toaster position="top-right" richColors />
      {authed ? (
        <Dashboard onLogout={() => setAuthed(false)} />
      ) : (
        <Login onLogin={() => setAuthed(true)} />
      )}
    </>
  );
}

/* ------------------------------ LOGIN ------------------------------ */
function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@reef.gov");
  const [pw, setPw] = useState("••••••••");
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left hero */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 gradient-primary text-primary-foreground overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, oklch(1 0 0 / 0.4), transparent 40%), radial-gradient(circle at 80% 80%, oklch(1 0 0 / 0.25), transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-2 font-display font-bold text-xl">
          <img
            src="/logo.png"
            alt="Mabini, Batangas logo"
            className="size-9 rounded-xl object-contain"
          />
          Mabini, Batangas
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-5xl font-display font-bold leading-[1.05]">
            Dive tourism, orchestrated.
          </h1>
          <p className="text-primary-foreground/85 text-lg">
            Manage tourists, operators, receipts and dive manifestos from a
            single, calm command center.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { k: "12,480", v: "Tourists" },
              { k: "184", v: "Operators" },
              { k: "31,220", v: "Manifestos" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 border border-white/15"
              >
                <div className="text-2xl font-display font-bold">{s.k}</div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/75">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-sm text-primary-foreground/70">
          © 2026 Mabini, Batangas — Tourism Office
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="lg:hidden flex items-center gap-2 font-display font-bold text-xl text-foreground">
            <div className="size-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
              <Waves className="size-5" />
            </div>
            Mabini, Batangas
          </div>
          <div>
            <Badge
              variant="secondary"
              className="bg-primary-soft text-primary border-0"
            >
              Admin Login
            </Badge>
            <h2 className="mt-3 text-3xl font-display font-bold text-foreground">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your tourism office dashboard.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="pw">Password</Label>
                <a className="text-xs text-primary hover:underline" href="#">
                  Forgot?
                </a>
              </div>
              <Input
                id="pw"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                defaultChecked
                className="rounded accent-[var(--color-primary)]"
              />
              Keep me signed in
            </label>
          </div>
          <Button
            type="submit"
            className="w-full h-11 gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
          >
            Sign in <ChevronRight className="size-4 ml-1" />
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Protected by <ShieldCheck className="inline size-3.5 -mt-0.5" />{" "}
            Mabini, Batangas security
          </p>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------ DASHBOARD SHELL ------------------------------ */
const NAV: { key: Section; label: string; icon: any; group: string }[] = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard, group: "Main" },
  { key: "tourists", label: "Tourists", icon: Users, group: "Main" },
  {
    key: "establishments",
    label: "Establishments",
    icon: Building2,
    group: "Main",
  },
  { key: "dive-ops", label: "Dive Operations", icon: Waves, group: "Main" },
  { key: "dive-pass", label: "Dive Pass", icon: CreditCard, group: "Main" },
  { key: "analytics", label: "Analytics", icon: BarChart3, group: "Analytics" },
  {
    key: "announcements",
    label: "Announcements",
    icon: Megaphone,
    group: "Content",
  },
  { key: "settings", label: "Settings", icon: Settings, group: "System" },
];

function Dashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <RoleProvider>
      <DashboardShell onLogout={onLogout} />
    </RoleProvider>
  );
}

function DashboardShell({ onLogout }: { onLogout: () => void }) {
  const { search, setFilters } = useFilters();
  const [searchOpen, setSearchOpen] = useState(false);
  const { role } = useRole();
  const { theme, toggle } = useTheme();
  const section = search.section;
  const dr = useGlobalDateRange();
  const grouped = useMemo(() => {
    const g: Record<string, typeof NAV> = {};
    NAV.forEach((n) => {
      (g[n.group] ||= []).push(n);
    });
    return g;
  }, []);
  const visibleNav = useMemo(
    () => NAV.filter((n) => role === "superadmin" || n.group !== "System"),
    [role],
  );
  const current = NAV.find((n) => n.key === section)!;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-sidebar sticky top-0 h-screen">
          <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
            <img
              src="/logo.png"
              alt="Mabini, Batangas logo"
              className="size-9 rounded-xl object-contain"
            />
            <div>
              <div className="font-display font-bold text-foreground leading-none">
                Mabini, Batangas
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                Tourism Office
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {Object.entries(grouped).map(([group, items]) => {
              const groupItems = items.filter((n) =>
                visibleNav.some((v) => v.key === n.key),
              );
              if (groupItems.length === 0) return null;
              const hasActiveChild = groupItems.some((n) => n.key === section);
              return (
                <div key={group}>
                  <div
                    className={`px-3 text-[10px] font-semibold uppercase tracking-widest mb-2 ${
                      hasActiveChild
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {group}
                  </div>
                  <ul className="space-y-1">
                      {groupItems.map((n) => {
                        const active = n.key === section;
                        const Icon = n.icon;
                        return (
                          <li key={n.key}>
                            <button
                              onClick={() =>
                                setFilters({
                                  section: n.key,
                                  q: "",
                                  status: "All",
                                  nationality: "All",
                                  level: "All",
                                  site: "All",
                                  difficulty: "All",
                                  siteType: "All",
                                  dateFrom: "",
                                  dateTo: "",
                                  tab: "",
                                })
                              }
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                active
                                  ? "bg-primary-soft text-primary font-semibold"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
                              }`}
                            >
                              <Icon
                                className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                              />
                              {n.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                </div>
              );
            })}
          </nav>
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  AK
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">Admin Kalua</div>
                <div className="text-xs text-muted-foreground truncate">
                  admin@reef.gov
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={onLogout}
                title="Log out"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 px-2 pb-1">
              <RoleBadge compact />
              <span className="text-[10px] text-muted-foreground">
                {ROLE_META[role].desc}
              </span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="h-16 sticky top-0 z-20 backdrop-blur bg-background/80 border-b border-border flex items-center gap-4 px-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <button
                  onClick={() =>
                    setFilters({
                      section: "overview",
                      tab: "",
                    })
                  }
                  className="hover:text-foreground transition-colors"
                >
                  Dashboard
                </button>
                <ChevronRight className="size-3" />
                <span className="text-foreground font-medium">
                  {current.label}
                </span>
              </div>
              <h1 className="text-lg font-display font-semibold leading-none mt-1">
                {current.label}
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5">
                {(
                  [
                    ["today", "Today"],
                    ["7d", "7d"],
                    ["30d", "30d"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => dr.setRange(key)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all ${dr.range === key ? "bg-background shadow-sm font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() =>
                    dr.setRange(
                      "custom",
                      dr.globalDateFrom || "2026-07-01",
                      dr.globalDateTo || "2026-07-31",
                    )
                  }
                  className={`px-2.5 py-1 text-xs rounded-md transition-all ${dr.range === "custom" ? "bg-background shadow-sm font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Custom
                </button>
              </div>
              {dr.range === "custom" && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  <Input
                    type="date"
                    value={dr.globalDateFrom}
                    onChange={(e) =>
                      dr.setRange("custom", e.target.value, dr.globalDateTo)
                    }
                    className="w-[140px] h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">–</span>
                  <Input
                    type="date"
                    value={dr.globalDateTo}
                    onChange={(e) =>
                      dr.setRange("custom", dr.globalDateFrom, e.target.value)
                    }
                    className="w-[140px] h-8 text-xs"
                  />
                </div>
              )}
              <div className="w-px h-5 bg-border" />
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-muted-foreground hover:bg-secondary transition-colors"
              >
                <Search className="size-3.5" />
                <span>Search…</span>
                <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggle}
                title={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
              <NotificationsBell />
              <RoleBadge />
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  AK
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="p-6 space-y-6">
            <PageTransition section={section}>
              {section === "overview" && <Overview />}
              {section === "tourists" && <TouristMgmt />}
              {section === "establishments" && <EstablishmentsPage />}
              {section === "dive-ops" && <DiveOpsPage />}
              {section === "dive-pass" && <DivePassPage />}
              {section === "analytics" && <AnalyticsPage />}
              {section === "announcements" && <Announcements />}
              {section === "settings" && <SettingsPage />}
            </PageTransition>
          </main>
        </div>
      </div>

      {/* Global Search */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search tourists, operators, receipts, dive sites…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Tourists">
            {tourists.map((t) => (
              <CommandItem
                key={t.id}
                value={`tourist ${t.name} ${t.id} ${t.nationality} ${t.level}`}
                onSelect={() => {
                  setFilters({ section: "tourists", q: t.name });
                  setSearchOpen(false);
                }}
              >
                <Users className="size-4 text-muted-foreground" />
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground text-xs">{t.id}</span>
                <CommandShortcut>{t.nationality}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Operators">
            {operatorApps.map((o) => (
              <CommandItem
                key={o.id}
                value={`operator ${o.name} ${o.owner} ${o.id} ${o.status}`}
                onSelect={() => {
                  setFilters({
                    section: "establishments",
                    tab: "applications",
                    q: o.name,
                  });
                  setSearchOpen(false);
                }}
              >
                <Building2 className="size-4 text-muted-foreground" />
                <span className="font-medium">{o.name}</span>
                <span className="text-muted-foreground text-xs">{o.owner}</span>
                <CommandShortcut>{o.status}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Receipts">
            {receipts.map((r) => (
              <CommandItem
                key={r.id}
                value={`receipt ${r.operator} ${r.ref} ${r.id} ${r.amount}`}
                onSelect={() => {
                  setFilters({
                    section: "dive-pass",
                    tab: "payments",
                    q: r.ref,
                  });
                  setSearchOpen(false);
                }}
              >
                <Receipt className="size-4 text-muted-foreground" />
                <span className="font-medium">{r.operator}</span>
                <span className="text-muted-foreground text-xs font-mono">
                  {r.ref}
                </span>
                <CommandShortcut>{r.amount}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Dive Sites">
            {diveSites.map((s) => (
              <CommandItem
                key={s.id}
                value={`dive site ${s.name} ${s.id} ${s.barangay} ${s.type} ${s.difficulty}`}
                onSelect={() => {
                  setFilters({ section: "dive-ops", tab: "sites", q: s.name });
                  setSearchOpen(false);
                }}
              >
                <MapPin className="size-4 text-muted-foreground" />
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground text-xs">
                  {s.barangay}
                </span>
                <CommandShortcut>{s.depth}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <SessionGuard onExpire={onLogout} />
    </div>
  );
}

function RoleBadge({ compact = false }: { compact?: boolean }) {
  const { role, setRole } = useRole();
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title={`Current view: ${meta.label}. Click to switch.`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-85 ${meta.className}`}
        >
          <Icon className="size-3.5" />
          {!compact && <span className="hidden md:inline">{meta.label}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Role-based view</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={role}
          onValueChange={(v) => setRole(v as Role)}
        >
          {(Object.keys(ROLE_META) as Role[]).map((r) => {
            const m = ROLE_META[r];
            const RIcon = m.icon;
            return (
              <DropdownMenuRadioItem key={r} value={r} className="py-2">
                <RIcon className="size-4 mr-2 text-muted-foreground" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {m.desc}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationsBell() {
  const { notifs, unread } = useNotifications();
  const { setFilters } = useFilters();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          title="Notifications"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">
              {unread} unread · {notifs.length} total
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={markAllNotifsRead}
            disabled={unread === 0}
          >
            Mark all read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {notifs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
              <BellOff className="size-6 opacity-40" />
              <span className="text-sm">You're all caught up.</span>
            </div>
          ) : (
            notifs.slice(0, 20).map((n) => {
              const Icon = NOTIF_ICONS[n.kind];
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setFilters({
                      section: n.section as any,
                      q: "",
                      status: "All",
                      nationality: "All",
                      level: "All",
                      site: "All",
                      difficulty: "All",
                      siteType: "All",
                      dateFrom: "",
                      dateTo: "",
                      tab: "",
                    });
                    markNotifRead(n.id);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-soft/40 ${n.read ? "opacity-60" : ""}`}
                >
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${n.read ? "bg-secondary text-muted-foreground" : "bg-primary-soft text-primary"}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="size-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {n.detail}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {n.at}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
          {unread > 0
            ? `${unread} item${unread > 1 ? "s" : ""} need${unread === 1 ? "s" : ""} your attention — pending receipts & new applications.`
            : "All notifications are up to date."}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------ SHARED UI ------------------------------ */
function DrilldownDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  stats,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  subtitle?: string;
  stats?: { label: string; value: string | number; icon?: any }[];
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </DialogHeader>
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((s) => (
              <Card key={s.label} className="p-3 shadow-elegant">
                <div className="flex items-center gap-2">
                  {s.icon && (
                    <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                      <s.icon className="size-4" />
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-lg font-display font-bold">
                      {s.value}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ icon: Icon, label, value, delta, up = true }: any) {
  return (
    <Card className="p-5 shadow-elegant border-border/60 hover:border-primary/30 hover:shadow-glow-sm transition-all hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-3xl font-display font-bold tracking-tight">
            <CountUp value={value} />
          </div>
        </div>
        <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
          <Icon className="size-5" />
        </div>
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
              up
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {up ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {delta}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </Card>
  );
}

function SectionCard({ title, action, children, className = "" }: any) {
  return (
    <Card className={`p-5 shadow-elegant border-border/60 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/10 text-success border-success/20",
    Approved: "bg-success/10 text-success border-success/20",
    Pending: "bg-warning/15 text-warning-foreground border-warning/30",
    Expired: "bg-muted text-muted-foreground border-border",
    Rejected: "bg-destructive/10 text-destructive border-destructive/20",
    Suspended: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge variant="outline" className={`${map[status] ?? ""} font-medium`}>
      {status}
    </Badge>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function ActiveFilterBadges({
  filters,
  onRemove,
}: {
  filters: { key: string; label: string }[];
  onRemove: (key: string) => void;
}) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((f) => (
        <Badge
          key={f.key}
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-0.5 text-xs"
        >
          {f.label}
          <button
            onClick={() => onRemove(f.key)}
            className="ml-0.5 rounded-full hover:bg-muted p-0.5"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

/* ------------------------------ OVERVIEW ------------------------------ */
function Overview() {
  const { setFilters } = useFilters();
  const { visibleMonths, scale } = useGlobalDateRange();
  const [drillMonth, setDrillMonth] = useState<any>(null);
  const [drillNationality, setDrillNationality] = useState<any>(null);
  const [drillSite, setDrillSite] = useState<any>(null);
  const [drillDiveType, setDrillDiveType] = useState<any>(null);
  const [drillLevel, setDrillLevel] = useState<any>(null);

  const monthDetail = drillMonth
    ? monthlyTrends.find((d) => d.m === drillMonth.m)
    : null;
  const filteredMonths = useMemo(
    () => monthlyTrends.filter((d) => visibleMonths.includes(d.m)),
    [visibleMonths],
  );
  const scaledNationality = useMemo(
    () =>
      nationality.map((n) => ({
        ...n,
        value: Math.round(n.value * Math.min(scale * 3, 1)),
      })),
    [scale],
  );
  const scaledDiveLevel = useMemo(
    () =>
      diveLevel.map((d) => ({
        ...d,
        value: Math.round(d.value * Math.min(scale * 3, 1)),
      })),
    [scale],
  );
  const scaledDiveType = useMemo(
    () =>
      diveType.map((d) => ({
        ...d,
        value: Math.round(d.value * Math.min(scale * 3, 1)),
      })),
    [scale],
  );
  const scaledTopSites = useMemo(
    () =>
      topSites.map((s) => ({
        ...s,
        value: Math.round(s.value * Math.min(scale * 3, 1)),
      })),
    [scale],
  );
  const totalTourists = useMemo(
    () => filteredMonths.reduce((a, m) => a + m.tourists, 0),
    [filteredMonths],
  );
  const totalDives = useMemo(
    () => filteredMonths.reduce((a, m) => a + m.dives, 0),
    [filteredMonths],
  );
  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl gradient-primary text-primary-foreground p-6 md:p-8 shadow-glow">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 90% 10%, oklch(1 0 0 / 0.5), transparent 40%), radial-gradient(circle at 10% 90%, oklch(1 0 0 / 0.3), transparent 40%)",
            }}
          />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm text-primary-foreground/80">
                Good morning, Admin
              </div>
              <h2 className="mt-1 text-2xl md:text-3xl font-display font-bold">
                Today's dive activity is up{" "}
                <span className="underline decoration-white/40">+18%</span>
              </h2>
              <p className="mt-1 text-primary-foreground/80 max-w-xl">
                3 new operator applications and 5 receipts are waiting on your
                review.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="bg-white/15 hover:bg-white/25 text-primary-foreground border-0 backdrop-blur"
                onClick={() =>
                  setFilters({
                    section: "dive-ops",
                    tab: "manifestos",
                    q: "",
                    status: "All",
                    nationality: "All",
                    level: "All",
                    site: "All",
                    difficulty: "All",
                    siteType: "All",
                    dateFrom: "",
                    dateTo: "",
                  })
                }
              >
                <ScrollText className="size-4 mr-1.5" /> View manifestos
              </Button>
              <Button
                className="bg-white text-primary hover:bg-white/90"
                onClick={() =>
                  setFilters({
                    section: "announcements",
                    q: "",
                    status: "All",
                    nationality: "All",
                    level: "All",
                    site: "All",
                    difficulty: "All",
                    siteType: "All",
                    dateFrom: "",
                    dateTo: "",
                    tab: "",
                  })
                }
              >
                <Plus className="size-4 mr-1.5" /> New announcement
              </Button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              icon: Users,
              label: "Tourists",
              value: "810",
              delta: "+47",
            },
            {
              icon: UserCheck,
              label: "Active IDs",
              value: "358",
              delta: "+12",
            },
            {
              icon: Waves,
              label: "Today's Dives",
              value: "28",
              delta: "+6",
            },
            {
              icon: Building2,
              label: "Establishments",
              value: String(
                operatorApps.filter((a) => a.status === "Approved").length,
              ),
              delta: "+3",
            },
            {
              icon: MapPin,
              label: "Active Sites",
              value: String(
                diveSites.filter((s) => s.status === "Active").length,
              ),
              delta: "+1",
            },
          ].map((s) => (
            <StatCard
              key={s.label}
              icon={s.icon}
              label={s.label}
              value={s.value}
              delta={s.delta}
            />
          ))}
        </div>
      </Reveal>

      {/* Action Required Strip */}
      <ActionRequiredStrip
        receipts={receipts}
        operatorApps={operatorApps}
        manifestos={manifestos}
        tourists={tourists}
        setFilters={setFilters}
      />

      {/* Charts row 1 */}
      <Reveal>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SectionCard
            title="Monthly Trends"
            className="xl:col-span-2"
            action={
              <Tabs defaultValue="tourists">
                <TabsList className="bg-secondary">
                  <TabsTrigger value="tourists">Tourists</TabsTrigger>
                  <TabsTrigger value="dives">Dives</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart
                  data={filteredMonths}
                  margin={{ left: -12, right: 8, top: 8 }}
                  onClick={(e) =>
                    e?.activePayload?.[0]?.payload &&
                    setDrillMonth(e.activePayload[0].payload)
                  }
                >
                  <defs>
                    <linearGradient id="areaP" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="areaS" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--color-primary-glow)"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-primary-glow)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="m"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="dives"
                    stroke="var(--color-primary-glow)"
                    strokeWidth={2}
                    fill="url(#areaS)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tourists"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#areaP)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Nationality Mix">
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={scaledNationality}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                    onClick={(_, i) =>
                      setDrillNationality(scaledNationality[i])
                    }
                    className="cursor-pointer"
                  >
                    {scaledNationality.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {scaledNationality.map((n, i) => (
                <div key={n.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground">{n.name}</span>
                  <span className="ml-auto font-medium">{n.value}%</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </Reveal>

      {/* Charts row 2 */}
      <Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <SectionCard title="Dive Level">
            <div className="h-56">
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="30%"
                  outerRadius="100%"
                  data={diveLevel}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    background
                    cornerRadius={8}
                    onClick={(_, i) => setDrillLevel(scaledDiveLevel[i])}
                    className="cursor-pointer"
                  >
                    {scaledDiveLevel.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </RadialBar>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-1">
              {scaledDiveLevel.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: CHART_COLORS[i] }}
                  />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Dive Type">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart
                  data={scaledDiveType}
                  margin={{ left: -20, right: 8 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--color-primary)"
                    radius={[8, 8, 0, 0]}
                    onClick={(_, i) => setDrillDiveType(scaledDiveType[i])}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Top Dive Sites" className="xl:col-span-2">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart
                  data={scaledTopSites}
                  layout="vertical"
                  margin={{ left: 8, right: 8 }}
                >
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 6"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    onClick={(_, i) => setDrillSite(scaledTopSites[i])}
                    className="cursor-pointer"
                  >
                    {scaledTopSites.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      </Reveal>

      {/* Drill-down dialogs */}
      <DrilldownDialog
        open={!!drillMonth}
        onOpenChange={(o) => !o && setDrillMonth(null)}
        title={`${drillMonth?.m ?? ""} Overview`}
        subtitle="Monthly tourism activity breakdown"
        stats={
          drillMonth
            ? [
                {
                  label: "Tourists",
                  value: drillMonth.tourists.toLocaleString(),
                  icon: Users,
                },
                {
                  label: "Dives",
                  value: drillMonth.dives.toLocaleString(),
                  icon: Waves,
                },
                {
                  label: "Avg per tourist",
                  value: (
                    drillMonth.divers ??
                    drillMonth.dives / (drillMonth.tourists || 1)
                  ).toFixed(1),
                  icon: TrendingUp,
                },
              ]
            : undefined
        }
      >
        {drillMonth && (
          <Card className="p-4 shadow-elegant mt-2">
            <h4 className="font-display font-semibold text-sm mb-3">
              Monthly breakdown
            </h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground">
                    Tourists registered
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {drillMonth.tourists.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">
                    Total dives
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {drillMonth.dives.toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">
                    Dives per tourist
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(drillMonth.dives / drillMonth.tourists).toFixed(1)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">
                    Estimated revenue
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₱{(drillMonth.dives * 120).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        )}
      </DrilldownDialog>

      <DrilldownDialog
        open={!!drillNationality}
        onOpenChange={(o) => !o && setDrillNationality(null)}
        title={`${drillNationality?.name ?? ""} Tourists`}
        subtitle="Tourist breakdown by nationality"
        stats={
          drillNationality
            ? [
                {
                  label: "Share",
                  value: `${drillNationality.value}%`,
                  icon: Users,
                },
                {
                  label: "Est. count",
                  value: Math.round(
                    (12480 * drillNationality.value) / 100,
                  ).toLocaleString(),
                  icon: TrendingUp,
                },
              ]
            : undefined
        }
      >
        {drillNationality && (
          <Card className="p-4 shadow-elegant mt-2">
            <h4 className="font-display font-semibold text-sm mb-3">
              Top tourists from {drillNationality.name}
            </h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tourists
                  .filter(
                    (t) =>
                      t.nationality === drillNationality.name ||
                      (drillNationality.name === "Other" &&
                        ![
                          "USA",
                          "Germany",
                          "Japan",
                          "UK",
                          "Australia",
                        ].includes(t.nationality)),
                  )
                  .slice(0, 5)
                  .map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {t.flag} {t.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {t.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {t.status === "Active" ? (
                          <Badge className="bg-success/15 text-success border-success/20 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {t.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                {tourists.filter(
                  (t) =>
                    t.nationality === drillNationality.name ||
                    (drillNationality.name === "Other" &&
                      !["USA", "Germany", "Japan", "UK", "Australia"].includes(
                        t.nationality,
                      )),
                ).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-4"
                    >
                      No sample tourists in this group.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </DrilldownDialog>

      <DrilldownDialog
        open={!!drillSite}
        onOpenChange={(o) => !o && setDrillSite(null)}
        title={drillSite?.name ?? ""}
        subtitle="Dive site activity details"
        stats={
          drillSite
            ? [
                { label: "Total dives", value: drillSite.value, icon: Waves },
                {
                  label: "Rank",
                  value: `#${topSites.indexOf(drillSite) + 1}`,
                  icon: TrendingUp,
                },
                {
                  label: "Share",
                  value: `${((drillSite.value / topSites.reduce((a, s) => a + s.value, 0)) * 100).toFixed(1)}%`,
                  icon: BarChart3,
                },
              ]
            : undefined
        }
      >
        {drillSite &&
          (() => {
            const site = diveSites.find((s) => s.name === drillSite.name);
            return site ? (
              <Card className="p-4 shadow-elegant mt-2">
                <h4 className="font-display font-semibold text-sm mb-3">
                  Site details
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Property</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Barangay
                      </TableCell>
                      <TableCell className="font-medium">
                        {site.barangay}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Depth range
                      </TableCell>
                      <TableCell className="font-medium">
                        {site.depth}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Difficulty
                      </TableCell>
                      <TableCell className="font-medium">
                        {site.difficulty}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Type
                      </TableCell>
                      <TableCell className="font-medium">{site.type}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Status
                      </TableCell>
                      <TableCell className="font-medium">
                        {site.status}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        Description
                      </TableCell>
                      <TableCell className="text-sm">
                        {site.description}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card className="p-4 shadow-elegant mt-2 text-center text-muted-foreground">
                Site data not found in registry.
              </Card>
            );
          })()}
      </DrilldownDialog>

      <DrilldownDialog
        open={!!drillDiveType}
        onOpenChange={(o) => !o && setDrillDiveType(null)}
        title={`${drillDiveType?.name ?? ""} Dives`}
        subtitle="Dive type breakdown"
        stats={
          drillDiveType
            ? [
                {
                  label: "Share",
                  value: `${drillDiveType.value}%`,
                  icon: Waves,
                },
                {
                  label: "Est. dives",
                  value: Math.round(
                    (2140 * drillDiveType.value) / 100,
                  ).toLocaleString(),
                  icon: TrendingUp,
                },
              ]
            : undefined
        }
      >
        {drillDiveType && (
          <Card className="p-4 shadow-elegant mt-2">
            <h4 className="font-display font-semibold text-sm mb-3">
              Top sites for {drillDiveType.name} diving
            </h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Site</TableHead>
                  <TableHead>Type match</TableHead>
                  <TableHead>Dives</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diveSites
                  .filter((s) => s.type === drillDiveType.name)
                  .map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <MapPin className="size-3.5 inline mr-1 text-primary" />
                        {s.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {s.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.dives}</TableCell>
                    </TableRow>
                  ))}
                {diveSites.filter((s) => s.type === drillDiveType.name)
                  .length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-4"
                    >
                      No registered sites of this type.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </DrilldownDialog>

      <DrilldownDialog
        open={!!drillLevel}
        onOpenChange={(o) => !o && setDrillLevel(null)}
        title={`${drillLevel?.name ?? ""} Divers`}
        subtitle="Diver certification level breakdown"
        stats={
          drillLevel
            ? [
                {
                  label: "Share",
                  value: `${drillLevel.value}%`,
                  icon: ShieldCheck,
                },
                {
                  label: "Est. divers",
                  value: Math.round(
                    (12480 * drillLevel.value) / 100,
                  ).toLocaleString(),
                  icon: Users,
                },
              ]
            : undefined
        }
      >
        {drillLevel && (
          <Card className="p-4 shadow-elegant mt-2">
            <h4 className="font-display font-semibold text-sm mb-3">
              Sample {drillLevel.name} divers
            </h4>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tourists
                  .filter((t) => t.level === drillLevel.name)
                  .map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        {t.flag} {t.nationality}
                      </TableCell>
                      <TableCell>
                        {t.status === "Active" ? (
                          <Badge className="bg-success/15 text-success border-success/20 text-[10px]">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {t.status}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </DrilldownDialog>
    </div>
  );
}
function TouristMgmt() {
  const { search, setFilters, resetFilters } = useFilters();
  const { visibleMonths } = useGlobalDateRange();
  const { canAct, deny } = usePermission();
  const [touristList, setTouristList] = useState(tourists);
  const [viewing, setViewing] = useState<any>(null);
  const [touristDrilldown, setTouristDrilldown] = useState<any>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    name: "",
    nationality: "USA",
    flag: "🇺🇸",
    level: "Open Water",
    passType: "Daily" as "Daily" | "Annual",
  });

  const touristDiveHistory: Record<
    string,
    {
      date: string;
      site: string;
      depth: string;
      divemaster: string;
      operator: string;
    }[]
  > = {
    "TR-10241": [
      {
        date: "2026-07-20",
        site: "Blue Hole",
        depth: "32 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-22",
        site: "Coral Gardens",
        depth: "18 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-25",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-01",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-05",
        site: "Shark Point",
        depth: "30 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-10",
        site: "Loyzaga Wreck",
        depth: "35 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-14",
        site: "Blue Hole",
        depth: "38 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10242": [
      {
        date: "2026-06-30",
        site: "Shark Point",
        depth: "33 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-05",
        site: "Manta Reef",
        depth: "27 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-12",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-18",
        site: "Loyzaga Wreck",
        depth: "36 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-24",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-02",
        site: "Shark Point",
        depth: "34 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-08",
        site: "Manta Reef",
        depth: "29 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-12",
        site: "Blue Hole",
        depth: "39 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10243": [
      {
        date: "2026-06-18",
        site: "Coral Gardens",
        depth: "15 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-06-20",
        site: "Turtle Bay",
        depth: "10 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-22",
        site: "Coral Gardens",
        depth: "18 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10244": [
      {
        date: "2026-07-08",
        site: "Shark Point",
        depth: "30 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-14",
        site: "Manta Reef",
        depth: "26 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-20",
        site: "Blue Hole",
        depth: "37 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-28",
        site: "Loyzaga Wreck",
        depth: "34 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-04",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-11",
        site: "Shark Point",
        depth: "32 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10245": [
      {
        date: "2026-06-25",
        site: "Coral Gardens",
        depth: "16 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-02",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-10",
        site: "Manta Reef",
        depth: "24 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-18",
        site: "Coral Gardens",
        depth: "19 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10246": [
      {
        date: "2026-07-20",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-25",
        site: "Shark Point",
        depth: "35 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-30",
        site: "Manta Reef",
        depth: "30 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-03",
        site: "Loyzaga Wreck",
        depth: "38 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-08",
        site: "Coral Gardens",
        depth: "22 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-13",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10247": [
      {
        date: "2026-06-10",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-18",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-06-26",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-04",
        site: "Blue Hole",
        depth: "36 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-15",
        site: "Shark Point",
        depth: "31 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-01",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10248": [
      {
        date: "2026-07-26",
        site: "Coral Gardens",
        depth: "12 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-30",
        site: "Turtle Bay",
        depth: "10 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-04",
        site: "Coral Gardens",
        depth: "16 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-10",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10249": [
      {
        date: "2026-06-14",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-06-18",
        site: "Blue Hole",
        depth: "34 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-06-22",
        site: "Shark Point",
        depth: "30 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-28",
        site: "Loyzaga Wreck",
        depth: "32 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10250": [
      {
        date: "2026-07-12",
        site: "Blue Hole",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-18",
        site: "Coral Gardens",
        depth: "22 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-25",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-02",
        site: "Manta Reef",
        depth: "26 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-09",
        site: "Shark Point",
        depth: "32 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10251": [
      {
        date: "2026-06-28",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-04",
        site: "Shark Point",
        depth: "35 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-10",
        site: "Loyzaga Wreck",
        depth: "38 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-18",
        site: "Manta Reef",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-26",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-03",
        site: "Blue Hole",
        depth: "39 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-10",
        site: "Shark Point",
        depth: "33 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-15",
        site: "Loyzaga Wreck",
        depth: "36 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10252": [
      {
        date: "2026-07-05",
        site: "Coral Gardens",
        depth: "14 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-12",
        site: "Turtle Bay",
        depth: "10 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10253": [
      {
        date: "2026-07-04",
        site: "Shark Point",
        depth: "34 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-12",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-20",
        site: "Blue Hole",
        depth: "38 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-28",
        site: "Loyzaga Wreck",
        depth: "35 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-05",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10254": [
      {
        date: "2026-07-18",
        site: "Blue Hole",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-24",
        site: "Coral Gardens",
        depth: "18 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-01",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-08",
        site: "Manta Reef",
        depth: "26 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10255": [
      {
        date: "2026-06-22",
        site: "Coral Gardens",
        depth: "12 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-28",
        site: "Turtle Bay",
        depth: "8 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-06",
        site: "Coral Gardens",
        depth: "16 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-15",
        site: "Turtle Bay",
        depth: "12 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-02",
        site: "Coral Gardens",
        depth: "18 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10256": [
      {
        date: "2026-07-24",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-30",
        site: "Shark Point",
        depth: "32 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-06",
        site: "Blue Hole",
        depth: "36 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-12",
        site: "Loyzaga Wreck",
        depth: "34 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10257": [
      {
        date: "2026-06-26",
        site: "Blue Hole",
        depth: "35 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-03",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-10",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-18",
        site: "Shark Point",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-28",
        site: "Loyzaga Wreck",
        depth: "33 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-08-06",
        site: "Blue Hole",
        depth: "38 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-14",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
    ],
    "TR-10258": [
      {
        date: "2026-07-08",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-14",
        site: "Shark Point",
        depth: "35 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-07-22",
        site: "Loyzaga Wreck",
        depth: "38 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-30",
        site: "Manta Reef",
        depth: "30 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-07",
        site: "Coral Gardens",
        depth: "22 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-14",
        site: "Blue Hole",
        depth: "40 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
    "TR-10259": [
      {
        date: "2026-06-14",
        site: "Coral Gardens",
        depth: "10 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-06-20",
        site: "Turtle Bay",
        depth: "8 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-06-28",
        site: "Coral Gardens",
        depth: "14 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
    ],
    "TR-10260": [
      {
        date: "2026-07-16",
        site: "Shark Point",
        depth: "32 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-07-22",
        site: "Blue Hole",
        depth: "36 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
      {
        date: "2026-07-28",
        site: "Manta Reef",
        depth: "28 m",
        divemaster: "Marco Silva",
        operator: "Island Dive Co",
      },
      {
        date: "2026-08-04",
        site: "Coral Gardens",
        depth: "20 m",
        divemaster: "Kai Reyes",
        operator: "Deep Blue Divers",
      },
      {
        date: "2026-08-11",
        site: "Turtle Bay",
        depth: "14 m",
        divemaster: "Lena Cruz",
        operator: "AquaVenture",
      },
    ],
  };

  const filtered = useMemo(() => {
    const monthSet = new Set(visibleMonths);
    return touristList.filter((t) => {
      if (search.status !== "All" && t.status !== search.status) return false;
      if (search.nationality !== "All" && t.nationality !== search.nationality)
        return false;
      if (search.level !== "All" && t.level !== search.level) return false;
      if (monthSet.size < 12) {
        const d = new Date(t.registered + "T00:00:00");
        const key = d.toLocaleString("en", { month: "short" });
        if (!monthSet.has(key)) return false;
      }
      if (search.q) {
        const q = search.q.toLowerCase();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [
    search.q,
    search.status,
    search.nationality,
    search.level,
    visibleMonths,
  ]);

  const {
    page: tPage,
    setPage: tSetPage,
    totalPages: tTotalPages,
    paged: tPaged,
  } = usePagination(filtered, 10);

  const activeFilters: { key: string; label: string }[] = [];
  if (search.status !== "All")
    activeFilters.push({ key: "status", label: `Status: ${search.status}` });
  if (search.nationality !== "All")
    activeFilters.push({
      key: "nationality",
      label: `Nationality: ${search.nationality}`,
    });
  if (search.level !== "All")
    activeFilters.push({ key: "level", label: `Level: ${search.level}` });
  if (search.q)
    activeFilters.push({ key: "q", label: `Search: "${search.q}"` });

  const handleRemoveFilter = (key: string) => {
    if (key === "q") setFilters({ q: "" });
    else if (key === "status") setFilters({ status: "All" });
    else if (key === "nationality") setFilters({ nationality: "All" });
    else if (key === "level") setFilters({ level: "All" });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID…"
              value={search.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={search.status}
            onValueChange={(v) => setFilters({ status: v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Active", "Expired", "Suspended"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.nationality}
            onValueChange={(v) => setFilters({ nationality: v })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Nationality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All nationalities</SelectItem>
              {ALL_NATIONALITIES.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={search.level}
            onValueChange={(v) => setFilters({ level: v })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Dive Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All levels</SelectItem>
              {ALL_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              <X className="size-3.5 mr-1" /> Clear all
            </Button>
          )}
          <Button
            className="ml-auto gradient-primary text-primary-foreground"
            onClick={() => {
              if (!canAct) return deny();
              setRegisterOpen(true);
            }}
          >
            <Plus className="size-4 mr-1.5" /> Register Tourist
          </Button>
        </div>
        <ActiveFilterBadges
          filters={activeFilters}
          onRemove={handleRemoveFilter}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} of {touristList.length} tourist
        {touristList.length !== 1 ? "s" : ""}
      </div>

      <Card className="shadow-elegant overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Tourist ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Dive Level</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No tourists match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              tPaged.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setTouristDrilldown(t)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {t.id}
                  </TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    {t.flag} {t.nationality}
                  </TableCell>
                  <TableCell>{t.level}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.registered}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.expires}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewing(t);
                      }}
                    >
                      <Eye className="size-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <Pagination
          page={tPage}
          totalPages={tTotalPages}
          onPageChange={tSetPage}
          className="mt-4"
        />
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tourist Profile</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {viewing.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-display text-lg font-semibold">
                    {viewing.name}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {viewing.id}
                  </div>
                </div>
                <StatusBadge status={viewing.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field
                  label="Nationality"
                  value={`${viewing.flag} ${viewing.nationality}`}
                />
                <Field label="Dive Level" value={viewing.level} />
                <Field label="Registered" value={viewing.registered} />
                <Field label="ID Expires" value={viewing.expires} />
                <Field label="Total Dives" value="47" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1">
                  Suspend
                </Button>
                <Button className="flex-1 gradient-primary text-primary-foreground">
                  Renew ID
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DrilldownDialog
        open={!!touristDrilldown}
        onOpenChange={(o) => !o && setTouristDrilldown(null)}
        title={`${touristDrilldown?.name ?? ""} — Dive History`}
        subtitle={`${touristDrilldown?.flag ?? ""} ${touristDrilldown?.nationality ?? ""} · ${touristDrilldown?.level ?? ""}`}
        stats={
          touristDrilldown
            ? [
                {
                  label: "Total Dives",
                  value: touristDiveHistory[touristDrilldown.id]?.length ?? 0,
                  icon: Waves,
                },
                {
                  label: "Tourist ID",
                  value: touristDrilldown.id,
                  icon: Users,
                },
                {
                  label: "Status",
                  value: touristDrilldown.status,
                  icon: ShieldCheck,
                },
              ]
            : undefined
        }
      >
        {touristDrilldown && (
          <Card className="shadow-elegant overflow-hidden mt-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Depth</TableHead>
                  <TableHead>Divemaster</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(touristDiveHistory[touristDrilldown.id] ?? []).length ===
                0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No dive history recorded for this tourist.
                    </TableCell>
                  </TableRow>
                ) : (
                  (touristDiveHistory[touristDrilldown.id] ?? []).map(
                    (dive, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {dive.date}
                        </TableCell>
                        <TableCell className="font-medium">
                          {dive.site}
                        </TableCell>
                        <TableCell>{dive.depth}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {dive.divemaster}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dive.operator}
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </DrilldownDialog>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register Tourist</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Add a new tourist to the registry.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name</Label>
              <Input
                id="reg-name"
                placeholder="e.g. Juan Dela Cruz"
                value={regForm.name}
                onChange={(e) =>
                  setRegForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Select
                  value={regForm.nationality}
                  onValueChange={(v) => {
                    const flagMap: Record<string, string> = {
                      USA: "🇺🇸",
                      Japan: "🇯🇵",
                      Germany: "🇩🇪",
                      Sweden: "🇸🇪",
                      Brazil: "🇧🇷",
                      Mexico: "🇲🇽",
                      UK: "🇬🇧",
                      Italy: "🇮🇹",
                      UAE: "🇦🇪",
                    };
                    setRegForm((p) => ({
                      ...p,
                      nationality: v,
                      flag: flagMap[v] ?? "🏳️",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_NATIONALITIES.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dive Level</Label>
                <Select
                  value={regForm.level}
                  onValueChange={(v) =>
                    setRegForm((p) => ({ ...p, level: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dive Pass Type</Label>
              <Select
                value={regForm.passType}
                onValueChange={(v) =>
                  setRegForm((p) => ({
                    ...p,
                    passType: v as "Daily" | "Annual",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pass type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily — 1 day</SelectItem>
                  <SelectItem value="Annual">Annual — 365 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {regForm.passType === "Daily"
                  ? "Valid for the day of registration."
                  : "Valid for one year from registration."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={() => {
                if (!regForm.name.trim()) {
                  toast.error("Name is required");
                  return;
                }
                const newId = `TR-${10271 + touristList.length}`;
                const today = new Date().toISOString().slice(0, 10);
                let expires: string;
                if (regForm.passType === "Daily") {
                  // Daily pass expires same day
                  expires = today;
                } else {
                  const nextYear = new Date();
                  nextYear.setFullYear(nextYear.getFullYear() + 1);
                  expires = nextYear.toISOString().slice(0, 10);
                }
                const newTourist: any = {
                  id: newId,
                  name: regForm.name.trim(),
                  nationality: regForm.nationality,
                  flag: regForm.flag,
                  level: regForm.level,
                  passType: regForm.passType,
                  status: "Active",
                  registered: today,
                  expires,
                };
                setTouristList((prev) => [newTourist, ...prev]);
                pushAuditLog(
                  `Registered tourist ${newId} — ${regForm.name.trim()} (${regForm.passType} pass)`,
                );
                toast.success("Tourist registered", {
                  description: `${newId} — ${regForm.name.trim()} · ${regForm.passType} Pass`,
                });
                setRegForm({
                  name: "",
                  nationality: "USA",
                  flag: "🇺🇸",
                  level: "Open Water",
                  passType: "Daily",
                });
                setRegisterOpen(false);
              }}
            >
              <Check className="size-4 mr-1" /> Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------ OPERATORS ------------------------------ */
export function OperatorMgmt() {
  const { canAct, deny } = usePermission();
  const { search, setFilters } = useFilters();
  const { visibleMonths } = useGlobalDateRange();
  const [apps, setApps] = useState(operatorApps);
  const [busy, setBusy] = useState<Record<string, "approve" | "reject" | null>>(
    {},
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{
    ids: string[];
    single: string | null;
  } | null>(null);

  const currentTab = search.tab || "applications";

  const filteredApps = useMemo(() => {
    const monthSet = new Set(visibleMonths);
    return apps.filter((o) => {
      if (search.status !== "All" && o.status !== search.status) return false;
      if (monthSet.size < 12) {
        const d = new Date(o.submitted + "T00:00:00");
        const key = d.toLocaleString("en", { month: "short" });
        if (!monthSet.has(key)) return false;
      }
      if (search.q) {
        const q = search.q.toLowerCase();
        if (
          !o.name.toLowerCase().includes(q) &&
          !o.owner.toLowerCase().includes(q) &&
          !o.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [apps, search.q, search.status, visibleMonths]);

  const {
    page: oPage,
    setPage: oSetPage,
    totalPages: oTotalPages,
    paged: oPaged,
  } = usePagination(filteredApps, 10);

  const activeFilters: { key: string; label: string }[] = [];
  if (search.status !== "All")
    activeFilters.push({ key: "status", label: `Status: ${search.status}` });
  if (search.q)
    activeFilters.push({ key: "q", label: `Search: "${search.q}"` });

  const handleRemoveFilter = (key: string) => {
    if (key === "q") setFilters({ q: "" });
    else if (key === "status") setFilters({ status: "All" });
  };

  const decide = async (
    id: string,
    decision: "Approved" | "Rejected",
    reason?: string,
  ) => {
    if (!canAct) return deny();
    const key = decision === "Approved" ? "approve" : "reject";
    setBusy((b) => ({ ...b, [id]: key }));
    const prev = apps.find((a) => a.id === id)?.status ?? "Pending";
    await new Promise((r) => setTimeout(r, 500));
    setApps((prevApps) =>
      prevApps.map((a) =>
        a.id === id
          ? {
              ...a,
              status: decision,
              ...(decision === "Rejected" ? { rejectReason: reason } : {}),
            }
          : a,
      ),
    );
    setBusy((b) => ({ ...b, [id]: null }));
    const t = decision === "Approved" ? toast.success : toast.error;
    t(`Application ${decision.toLowerCase()}`, {
      description: `${id} — the operator has been notified by email.`,
      action: {
        label: "Undo",
        onClick: () => {
          setApps((prevApps) =>
            prevApps.map((a) =>
              a.id === id ? { ...a, status: prev, rejectReason: undefined } : a,
            ),
          );
          toast.info(`Reverted ${id}`, {
            description: `Status restored to ${prev}.`,
          });
        },
      },
    });
    pushAuditLog(
      decision === "Approved"
        ? `Approved operator ${id}`
        : `Rejected operator ${id} — ${reason}`,
    );
    if (decision === "Approved") {
      pushNotif({
        id: `na-${id}`,
        kind: "application",
        title: `Application ${id} approved`,
        detail: `${id} is now an active operator.`,
        section: "operators",
        at: "Just now",
      });
    }
  };

  const pendingCount = apps.filter((a) => a.status === "Pending").length;
  const selectablePending = filteredApps.filter((a) => a.status === "Pending");
  const allSelected =
    selectablePending.length > 0 &&
    selectablePending.every((a) => selected.has(a.id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectablePending.map((a) => a.id)));
    }
  };

  const bulkDecide = async (
    decision: "Approved" | "Rejected",
    reason?: string,
  ) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!canAct) return deny();
    setBulkBusy(true);
    const key = decision === "Approved" ? "approve" : "reject";
    setBusy((b) => {
      const n = { ...b };
      ids.forEach((id) => {
        n[id] = key as any;
      });
      return n;
    });
    await new Promise((r) => setTimeout(r, 800));
    setApps((prev) =>
      prev.map((a) =>
        ids.includes(a.id)
          ? {
              ...a,
              status: decision,
              ...(decision === "Rejected" ? { rejectReason: reason } : {}),
            }
          : a,
      ),
    );
    setBusy((b) => {
      const n = { ...b };
      ids.forEach((id) => {
        n[id] = null;
      });
      return n;
    });
    setSelected(new Set());
    setBulkBusy(false);
    toast.success(
      `${ids.length} application${ids.length !== 1 ? "s" : ""} ${decision.toLowerCase()}`,
      {
        description: `Bulk action completed. Operators have been notified.`,
        icon:
          decision === "Approved" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          ),
      },
    );
    if (decision === "Rejected") {
      ids.forEach((id) => pushAuditLog(`Rejected operator ${id} — ${reason}`));
    } else {
      ids.forEach((id) => pushAuditLog(`Approved operator ${id}`));
      ids.forEach((id) =>
        pushNotif({
          id: `na-${id}`,
          kind: "application",
          title: `Application ${id} approved`,
          detail: `${id} is now an active operator.`,
          section: "operators",
          at: "Just now",
        }),
      );
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={currentTab} onValueChange={(v) => setFilters({ tab: v })}>
        <div className="flex items-center justify-between gap-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="applications">
              Applications
              {pendingCount > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-primary text-primary-foreground">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active Operators</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, owner, or ID…"
                value={search.q}
                onChange={(e) => setFilters({ q: e.target.value })}
                className="pl-9 h-8 w-[320px] text-sm"
              />
            </div>
            <Select
              value={search.status}
              onValueChange={(v) => setFilters({ status: v })}
            >
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {["All", "Pending", "Approved", "Rejected"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeFilters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ q: "", status: "All" })}
                className="text-muted-foreground"
              >
                <X className="size-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
        <TabsContent value="applications" className="mt-4">
          <div className="space-y-3">
            <ActiveFilterBadges
              filters={activeFilters}
              onRemove={handleRemoveFilter}
            />
            <div className="text-xs text-muted-foreground">
              {filteredApps.length} of {apps.length} application
              {apps.length !== 1 ? "s" : ""}
            </div>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary-soft/30 animate-fade-in">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
              <span className="text-sm text-muted-foreground">
                {selected.size} selected
              </span>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-muted-foreground"
                  onClick={() => setSelected(new Set())}
                >
                  <X className="size-3.5" />
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-success hover:bg-success/10"
                  disabled={bulkBusy}
                  onClick={() => bulkDecide("Approved")}
                >
                  {bulkBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-destructive hover:bg-destructive/10"
                  disabled={bulkBusy}
                  onClick={() =>
                    setRejectDialog({ ids: [...selected], single: null })
                  }
                >
                  {bulkBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          )}
          <Card className="shadow-elegant overflow-hidden mt-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No applications match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  oPaged.map((o) => {
                    const settled = o.status !== "Pending";
                    const b = busy[o.id];
                    return (
                      <TableRow
                        key={o.id}
                        className={`transition-colors ${
                          o.status === "Approved"
                            ? "bg-success/5"
                            : o.status === "Rejected"
                              ? "bg-destructive/5"
                              : selected.has(o.id)
                                ? "bg-primary-soft/30"
                                : "hover:bg-primary-soft/40"
                        }`}
                      >
                        <TableCell className="w-10">
                          <Checkbox
                            checked={selected.has(o.id)}
                            onCheckedChange={() => toggleSelect(o.id)}
                            disabled={o.status !== "Pending"}
                            aria-label={`Select ${o.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {o.id}
                        </TableCell>
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell>{o.owner}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {o.submitted}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          {settled ? (
                            <div className="inline-flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium ${
                                  o.status === "Approved"
                                    ? "text-success"
                                    : "text-destructive"
                                }`}
                                title={o.rejectReason}
                              >
                                {o.status === "Approved" ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <XCircle className="size-4" />
                                )}
                                {o.status === "Approved"
                                  ? "Approved"
                                  : "Rejected"}
                              </span>
                              {o.status === "Rejected" && o.rejectReason && (
                                <div
                                  className="mt-1 max-w-[180px] text-[10px] text-destructive/80 line-clamp-2"
                                  title={o.rejectReason}
                                >
                                  {o.rejectReason}
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setApps((prev) =>
                                    prev.map((a) =>
                                      a.id === o.id
                                        ? { ...a, status: "Pending" }
                                        : a,
                                    ),
                                  );
                                  toast.info("Marked as pending again", {
                                    description: o.id,
                                  });
                                }}
                              >
                                <RotateCcw className="size-3.5 mr-1" /> Reopen
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!!b}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  setRejectDialog({ ids: [o.id], single: o.id })
                                }
                              >
                                {b === "reject" ? (
                                  <Loader2 className="size-4 mr-1 animate-spin" />
                                ) : (
                                  <X className="size-4 mr-1" />
                                )}
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                disabled={!!b}
                                className="bg-success text-success-foreground hover:opacity-90"
                                onClick={() => decide(o.id, "Approved")}
                              >
                                {b === "approve" ? (
                                  <Loader2 className="size-4 mr-1 animate-spin" />
                                ) : (
                                  <Check className="size-4 mr-1" />
                                )}
                                Approve
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Pagination
              page={oPage}
              totalPages={oTotalPages}
              onPageChange={oSetPage}
              className="mt-4 px-4"
            />
          </Card>
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          {(() => {
            const activeOps = apps.filter((a) => a.status === "Approved");
            return activeOps.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground shadow-elegant">
                No active operators found.
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOps.map((o) => (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() =>
                          setFilters({
                            section: "establishments",
                            tab: "registered",
                            q: o.name,
                          })
                        }
                      >
                        <TableCell>
                          <span className="font-mono text-xs">{o.id}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{o.name}</span>
                        </TableCell>
                        <TableCell>{o.owner}</TableCell>
                        <TableCell>{o.submitted}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setRejectDialog({
                                ids: [o.id],
                                single: o.id,
                              });
                            }}
                          >
                            <Ban className="size-3 mr-1" />
                            Deactivate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      <RejectReasonDialog
        open={!!rejectDialog}
        onOpenChange={(o) => !o && setRejectDialog(null)}
        title="Reject application"
        itemLabel="application"
        count={rejectDialog?.ids.length}
        onConfirm={(reason) => {
          const d = rejectDialog!;
          setRejectDialog(null);
          if (d.single) decide(d.single, "Rejected", reason);
          else bulkDecide("Rejected", reason);
        }}
      />
    </div>
  );
}

/* ------------------------------ RECEIPTS ------------------------------ */
export function ReceiptVerification() {
  const { canAct, deny } = usePermission();
  const { search, setFilters, resetFilters } = useFilters();
  const { visibleMonths } = useGlobalDateRange();
  const [viewing, setViewing] = useState<any>(null);
  const [lightbox, setLightbox] = useState<any>(null);
  const [items, setItems] = useState(receipts);
  const [busy, setBusy] = useState<Record<string, "approve" | "reject" | null>>(
    {},
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{
    ids: string[];
    single: string | null;
  } | null>(null);

  const filtered = useMemo(() => {
    const monthSet = new Set(visibleMonths);
    return items.filter((r) => {
      if (search.status !== "All" && r.status !== search.status) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        if (
          !r.operator.toLowerCase().includes(q) &&
          !r.ref.toLowerCase().includes(q) &&
          !r.id.toLowerCase().includes(q)
        )
          return false;
      }
      if (search.dateFrom && r.date < search.dateFrom) return false;
      if (search.dateTo && r.date > search.dateTo) return false;
      if (monthSet.size < 12) {
        const d = new Date(r.date + "T00:00:00");
        const key = d.toLocaleString("en", { month: "short" });
        if (!monthSet.has(key)) return false;
      }
      return true;
    });
  }, [
    items,
    search.q,
    search.status,
    search.dateFrom,
    search.dateTo,
    visibleMonths,
  ]);

  const {
    page: rPage,
    setPage: rSetPage,
    totalPages: rTotalPages,
    paged: rPaged,
  } = usePagination(filtered, 12);

  const activeFilters: { key: string; label: string }[] = [];
  if (search.status !== "All")
    activeFilters.push({ key: "status", label: `Status: ${search.status}` });
  if (search.q)
    activeFilters.push({ key: "q", label: `Search: "${search.q}"` });
  if (search.dateFrom)
    activeFilters.push({ key: "dateFrom", label: `From: ${search.dateFrom}` });
  if (search.dateTo)
    activeFilters.push({ key: "dateTo", label: `To: ${search.dateTo}` });

  const handleRemoveFilter = (key: string) => {
    if (key === "q") setFilters({ q: "" });
    else if (key === "status") setFilters({ status: "All" });
    else if (key === "dateFrom") setFilters({ dateFrom: "" });
    else if (key === "dateTo") setFilters({ dateTo: "" });
  };

  const decide = async (
    id: string,
    decision: "Verified" | "Rejected",
    reason?: string,
  ) => {
    if (!canAct) return deny();
    const key = decision === "Verified" ? "approve" : "reject";
    setBusy((b) => ({ ...b, [id]: key }));
    const target = items.find((r) => r.id === id);
    await new Promise((r) => setTimeout(r, 600));
    setItems((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: decision === "Verified" ? "Approved" : "Rejected",
              ...(decision === "Rejected" ? { rejectReason: reason } : {}),
            }
          : r,
      ),
    );
    setBusy((b) => ({ ...b, [id]: null }));
    setViewing((v: any) => (v && v.id === id ? null : v));
    const t = decision === "Verified" ? toast.success : toast.error;
    t(decision === "Verified" ? "Receipt verified" : "Receipt rejected", {
      description: `${target?.operator} · Ref ${target?.ref} · ${target?.amount}`,
      icon:
        decision === "Verified" ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <XCircle className="size-4" />
        ),
    });
    pushAuditLog(
      decision === "Verified"
        ? `Verified receipt ${id}`
        : `Rejected receipt ${id} — ${reason}`,
    );
    if (decision === "Verified") {
      pushNotif({
        id: `nc-${id}`,
        kind: "receipt",
        title: `Receipt ${id} verified`,
        detail: `${target?.operator} · ${target?.amount} was approved.`,
        section: "receipts",
        at: "Just now",
      });
    }
  };

  const selectablePending = filtered.filter((r) => r.status === "Pending");
  const allSelected =
    selectablePending.length > 0 &&
    selectablePending.every((r) => selected.has(r.id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectablePending.map((r) => r.id)));
    }
  };

  const bulkDecide = async (
    decision: "Approved" | "Rejected",
    reason?: string,
  ) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!canAct) return deny();
    setBulkBusy(true);
    const key = decision === "Approved" ? "approve" : "reject";
    setBusy((b) => {
      const n = { ...b };
      ids.forEach((id) => {
        n[id] = key as any;
      });
      return n;
    });
    await new Promise((r) => setTimeout(r, 800));
    setItems((prev) =>
      prev.map((r) =>
        ids.includes(r.id)
          ? {
              ...r,
              status: decision,
              ...(decision === "Rejected" ? { rejectReason: reason } : {}),
            }
          : r,
      ),
    );
    setBusy((b) => {
      const n = { ...b };
      ids.forEach((id) => {
        n[id] = null;
      });
      return n;
    });
    setSelected(new Set());
    setBulkBusy(false);
    const label = decision === "Approved" ? "Verified" : "Rejected";
    toast.success(
      `${ids.length} receipt${ids.length !== 1 ? "s" : ""} ${label.toLowerCase()}`,
      {
        description: `Bulk action completed.`,
        icon:
          decision === "Approved" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          ),
      },
    );
    if (decision === "Rejected") {
      ids.forEach((id) => pushAuditLog(`Rejected receipt ${id} — ${reason}`));
    } else {
      ids.forEach((id) => pushAuditLog(`Verified receipt ${id}`));
      ids.forEach((id) =>
        pushNotif({
          id: `nc-${id}`,
          kind: "receipt",
          title: `Receipt ${id} verified`,
          detail: `${id} was approved in bulk.`,
          section: "receipts",
          at: "Just now",
        }),
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by operator, ref #, or receipt ID…"
              value={search.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={search.status}
            onValueChange={(v) => setFilters({ status: v })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {["All", "Pending", "Approved", "Rejected"].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              From
            </Label>
            <Input
              type="date"
              value={search.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input
              type="date"
              value={search.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              className="w-40"
            />
          </div>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              <X className="size-3.5 mr-1" /> Clear all
            </Button>
          )}
        </div>
        <ActiveFilterBadges
          filters={activeFilters}
          onRemove={handleRemoveFilter}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} of {items.length} receipt
        {items.length !== 1 ? "s" : ""}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary-soft/30 animate-fade-in">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all"
          />
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-3.5" />
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-success hover:bg-success/10"
              disabled={bulkBusy}
              onClick={() => bulkDecide("Approved")}
            >
              {bulkBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-destructive hover:bg-destructive/10"
              disabled={bulkBusy}
              onClick={() =>
                setRejectDialog({ ids: [...selected], single: null })
              }
            >
              {bulkBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No receipts match the current filters.
          </div>
        ) : (
          rPaged.map((r) => {
            const settled = r.status !== "Pending";
            const b = busy[r.id];
            const approved = r.status === "Approved";
            return (
              <Card
                key={r.id}
                className={`p-0 overflow-hidden shadow-elegant border-border/60 transition-all ${
                  approved
                    ? "border-success/40"
                    : r.status === "Rejected"
                      ? "border-destructive/40 opacity-80"
                      : selected.has(r.id)
                        ? "ring-2 ring-primary/40"
                        : "hover:shadow-glow"
                }`}
              >
                <div className="relative">
                  <div
                    className="absolute top-3 left-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-background/80 backdrop-blur-sm rounded-md p-0.5">
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggleSelect(r.id)}
                        disabled={r.status !== "Pending"}
                        aria-label={`Select receipt ${r.id}`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setLightbox(r)}
                    className="block w-full aspect-[4/3] bg-gradient-to-br from-primary-soft to-secondary relative cursor-zoom-in"
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-primary/40">
                      <ImageIcon className="size-16" />
                    </div>
                    <div className="absolute bottom-3 right-3 z-10 rounded-full bg-background/90 backdrop-blur border border-border/60 p-2 text-muted-foreground shadow-sm hover:text-primary">
                      <ZoomIn className="size-4" />
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewing(r);
                      }}
                      className="absolute bottom-3 left-3 z-10 rounded-full bg-background/90 backdrop-blur border border-border/60 p-2 text-muted-foreground shadow-sm hover:text-primary cursor-pointer"
                      title="Receipt details"
                    >
                      <Eye className="size-4" />
                    </div>
                    {r.rejectReason && (
                      <div className="absolute bottom-14 left-3 right-3 z-10 rounded-lg bg-destructive/90 backdrop-blur text-destructive-foreground text-[11px] px-3 py-1.5 shadow-glow">
                        Rejected: {r.rejectReason}
                      </div>
                    )}
                    {settled && (
                      <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] bg-background/40">
                        <div
                          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm shadow-glow ${
                            approved
                              ? "bg-success text-success-foreground"
                              : "bg-destructive text-destructive-foreground"
                          }`}
                        >
                          {approved ? (
                            <CheckCircle2 className="size-4" />
                          ) : (
                            <XCircle className="size-4" />
                          )}
                          {approved ? "Verified" : "Rejected"}
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={r.status} />
                    </div>
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.operator}</div>
                    <div className="font-display font-bold">{r.amount}</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">Ref: {r.ref}</span>
                    <span>{r.date}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {settled ? (
                      <div
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${
                          approved
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {approved ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                        {approved ? "Marked verified" : "Marked rejected"}
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!b}
                          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            setRejectDialog({ ids: [r.id], single: r.id })
                          }
                        >
                          {b === "reject" ? (
                            <Loader2 className="size-4 mr-1 animate-spin" />
                          ) : (
                            <X className="size-4 mr-1" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={!!b}
                          className="flex-1 bg-success text-success-foreground hover:opacity-90"
                          onClick={() => decide(r.id, "Verified")}
                        >
                          {b === "approve" ? (
                            <Loader2 className="size-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="size-4 mr-1" />
                          )}
                          Verify
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt {viewing?.id}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <button
                onClick={() => viewing && setLightbox(viewing)}
                className="aspect-video w-full rounded-xl bg-gradient-to-br from-primary-soft to-secondary flex items-center justify-center text-primary/40 relative cursor-zoom-in"
              >
                <ImageIcon className="size-20" />
                <div className="absolute bottom-3 right-3 rounded-full bg-background/90 backdrop-blur border border-border/60 p-2 text-muted-foreground shadow-sm">
                  <ZoomIn className="size-4" />
                </div>
              </button>
              {viewing.rejectReason && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
                  <XCircle className="size-4 mt-0.5 shrink-0" />
                  <span>
                    <strong>Rejection note:</strong> {viewing.rejectReason}
                  </span>
                </div>
              )}
              <div className="rounded-lg border border-primary/20 bg-primary-soft/60 p-3 flex items-start gap-2 text-sm">
                <AlertCircle className="size-4 text-primary mt-0.5 shrink-0" />
                <span className="text-primary">
                  Verify the reference number and amount match the bank
                  statement before approving.
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Operator" value={viewing.operator} />
                <Field label="Reference #" value={viewing.ref} />
                <Field label="Amount" value={viewing.amount} />
                <Field label="Submitted" value={viewing.date} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="border-destructive/30 text-destructive"
              disabled={!viewing || !!busy[viewing?.id]}
              onClick={() =>
                viewing &&
                setRejectDialog({ ids: [viewing.id], single: viewing.id })
              }
            >
              <X className="size-4 mr-1" />
              Reject
            </Button>
            <Button
              className="bg-success text-success-foreground"
              disabled={!viewing || !!busy[viewing?.id]}
              onClick={() => viewing && decide(viewing.id, "Verified")}
            >
              {viewing && busy[viewing.id] === "approve" ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Check className="size-4 mr-1" />
              )}
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectReasonDialog
        open={!!rejectDialog}
        onOpenChange={(o) => !o && setRejectDialog(null)}
        title="Reject receipt"
        itemLabel="receipt"
        count={rejectDialog?.ids.length}
        onConfirm={(reason) => {
          const d = rejectDialog!;
          setRejectDialog(null);
          if (d.single) decide(d.single, "Rejected", reason);
          else bulkDecide("Rejected", reason);
        }}
      />
      <ReceiptLightbox
        open={!!lightbox}
        onOpenChange={(o) => !o && setLightbox(null)}
        receipt={lightbox}
      />
    </div>
  );
}

/* ------------------------------ MANIFESTOS ------------------------------ */
export function ManifestoView() {
  const { canAct, deny } = usePermission();
  const { search, setFilters, resetFilters } = useFilters();
  const { visibleMonths } = useGlobalDateRange();
  const [viewing, setViewing] = useState<any>(null);
  const [items, setItems] = useState(manifestos);
  const [generating, setGenerating] = useState(false);
  const [rowBusy, setRowBusy] = useState<
    Record<string, "download" | "forward" | null>
  >({});
  const [generatedIds, setGeneratedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [forwardDialog, setForwardDialog] = useState<string[] | null>(null);
  const [forwardBusy, setForwardBusy] = useState(false);
  const [verifiedIds, setVerifiedIds] = useState<Set<string>>(() => {
    const preverified = new Set<string>();
    manifestos.slice(0, 15).forEach((m) => preverified.add(m.id));
    return preverified;
  });
  const [verificationFilter, setVerificationFilter] = useState<
    "all" | "verified" | "unverified"
  >("all");

  const toggleVerify = (id: string) => {
    setVerifiedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info(`Manifesto ${id} marked as unverified`);
      } else {
        next.add(id);
        toast.success(`Manifesto ${id} verified`);
        pushAuditLog(`Verified manifesto ${id}`);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const monthSet = new Set(visibleMonths);
    return items.filter((m) => {
      if (search.site !== "All" && m.site !== search.site) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        if (
          !m.operator.toLowerCase().includes(q) &&
          !m.site.toLowerCase().includes(q) &&
          !m.id.toLowerCase().includes(q)
        )
          return false;
      }
      if (search.dateFrom && m.date < search.dateFrom) return false;
      if (search.dateTo && m.date > search.dateTo) return false;
      if (monthSet.size < 12) {
        const d = new Date(m.date + "T00:00:00");
        const key = d.toLocaleString("en", { month: "short" });
        if (!monthSet.has(key)) return false;
      }
      if (verificationFilter === "verified" && !verifiedIds.has(m.id))
        return false;
      if (verificationFilter === "unverified" && verifiedIds.has(m.id))
        return false;
      return true;
    });
  }, [
    items,
    search.q,
    search.site,
    search.dateFrom,
    search.dateTo,
    visibleMonths,
  ]);

  const {
    page: mPage,
    setPage: mSetPage,
    totalPages: mTotalPages,
    paged: mPaged,
  } = usePagination(filtered, 12);

  const activeFilters: { key: string; label: string }[] = [];
  if (search.site !== "All")
    activeFilters.push({ key: "site", label: `Site: ${search.site}` });
  if (search.q)
    activeFilters.push({ key: "q", label: `Search: "${search.q}"` });
  if (search.dateFrom)
    activeFilters.push({ key: "dateFrom", label: `From: ${search.dateFrom}` });
  if (search.dateTo)
    activeFilters.push({ key: "dateTo", label: `To: ${search.dateTo}` });
  if (verificationFilter !== "all")
    activeFilters.push({
      key: "verification",
      label: `Verification: ${verificationFilter}`,
    });

  const handleRemoveFilter = (key: string) => {
    if (key === "q") setFilters({ q: "" });
    else if (key === "site") setFilters({ site: "All" });
    else if (key === "dateFrom") setFilters({ dateFrom: "" });
    else if (key === "dateTo") setFilters({ dateTo: "" });
    else if (key === "verification") setVerificationFilter("all");
  };

  const generate = async () => {
    setGenerating(true);
    const tId = toast.loading("Generating manifesto…", {
      description: "Compiling divers, site data and operator signatures.",
    });
    await new Promise((r) => setTimeout(r, 1400));
    const newItem = {
      id: `MF-${55030 + items.length + 1}`,
      operator: "Deep Blue Charters",
      site: "Blue Hole",
      divers: 6 + Math.floor(Math.random() * 8),
      date: new Date().toISOString().slice(0, 10),
    };
    setItems((prev) => [newItem, ...prev]);
    setGeneratedIds((s) => new Set(s).add(newItem.id));
    setGenerating(false);
    toast.success("Manifesto generated", {
      id: tId,
      description: `${newItem.id} · ${newItem.site} · ${newItem.divers} divers`,
      icon: <Sparkles className="size-4" />,
      action: { label: "View", onClick: () => setViewing(newItem) },
    });
  };

  const rowAction = async (m: any, kind: "download" | "forward") => {
    if (kind === "forward") {
      setForwardDialog([m.id]);
      return;
    }
    setRowBusy((b) => ({ ...b, [m.id]: kind }));
    const tId = toast.loading("Preparing download…");
    await new Promise((r) => setTimeout(r, 700));
    setRowBusy((b) => ({ ...b, [m.id]: null }));
    toast.success("Download ready", {
      id: tId,
      description: `${m.id} · ${m.site} — saved to your device.`,
      icon: <Download className="size-4" />,
    });
    pushAuditLog(`Downloaded manifesto ${m.id}`);
  };

  const allSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((m) => m.id)));
    }
  };

  const doForward = async (
    ids: string[],
    recipients: string[],
    message: string,
  ) => {
    if (!canAct) return deny();
    setForwardBusy(true);
    const tId = toast.loading(
      `Forwarding ${ids.length} manifesto${ids.length > 1 ? "s" : ""}…`,
    );
    await new Promise((r) => setTimeout(r, 900));
    setForwardBusy(false);
    toast.success(
      `Forwarded to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`,
      {
        id: tId,
        description: `${ids.length} manifesto${ids.length > 1 ? "s" : ""} · ${recipients.join(", ")}${message ? " · with note" : ""}`,
        icon: <Forward className="size-4" />,
      },
    );
    setForwardDialog(null);
    setSelected(new Set());
    ids.forEach((id) => pushAuditLog(`Forwarded manifesto ${id}`));
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by operator, site, or ID…"
              value={search.q}
              onChange={(e) => setFilters({ q: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select
            value={search.site}
            onValueChange={(v) => setFilters({ site: v })}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Dive site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All sites</SelectItem>
              {ALL_SITES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              From
            </Label>
            <Input
              type="date"
              value={search.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input
              type="date"
              value={search.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              className="w-40"
            />
          </div>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ q: "", site: "All", dateFrom: "", dateTo: "" });
                setVerificationFilter("all");
              }}
              className="text-muted-foreground"
            >
              <X className="size-3.5 mr-1" /> Clear
            </Button>
          )}
          <Button
            onClick={generate}
            disabled={generating}
            className="md:ml-auto gradient-primary text-primary-foreground shadow-glow"
          >
            {generating ? (
              <Loader2 className="size-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="size-4 mr-1.5" />
            )}
            {generating ? "Generating…" : "Generate Manifesto"}
          </Button>
        </div>
        <ActiveFilterBadges
          filters={activeFilters}
          onRemove={handleRemoveFilter}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} of {items.length} manifesto
        {items.length !== 1 ? "s" : ""}
      </div>

      <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5 w-fit">
        {(
          [
            ["all", "All"],
            ["verified", "Verified"],
            ["unverified", "Unverified"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setVerificationFilter(key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
              verificationFilter === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary-soft/30 animate-fade-in">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all"
          />
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-muted-foreground"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-3.5" />
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5"
              onClick={() => setForwardDialog([...selected])}
            >
              <Forward className="size-3.5" />{" "}
              <span className="ml-1 text-xs">Forward</span>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No manifestos match the current filters.
          </div>
        ) : (
          mPaged.map((m, idx) => {
            const isNew = generatedIds.has(m.id);
            const b = rowBusy[m.id];
            return (
              <div
                key={m.id}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <Card
                  className={`p-0 overflow-hidden shadow-elegant border-border/60 hover:shadow-glow hover:-translate-y-0.5 transition-all ${
                    isNew
                      ? "ring-2 ring-primary/40"
                      : selected.has(m.id)
                        ? "ring-2 ring-primary/40"
                        : ""
                  }`}
                >
                  <div
                    onClick={() => setViewing(m)}
                    className="block w-full aspect-[4/3] gradient-primary relative cursor-pointer"
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.6), transparent 50%)",
                      }}
                    />
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(m.id);
                      }}
                      className="absolute top-3 left-3 z-10 rounded-md bg-white/20 backdrop-blur p-0.5"
                    >
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={() => {}}
                        aria-label={`Select manifesto ${m.id}`}
                      />
                    </div>
                    <div className="absolute bottom-3 left-3 text-primary-foreground">
                      <div className="font-mono text-[10px] opacity-80">
                        {m.id}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters({
                            section: "dive-ops",
                            tab: "sites",
                            q: m.site,
                          });
                        }}
                        className="font-display font-semibold text-left underline decoration-dotted underline-offset-2 hover:decoration-solid transition-colors"
                      >
                        {m.site}
                      </button>
                    </div>
                    <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur text-primary-foreground text-xs font-medium px-2.5 py-1">
                      {m.divers} divers
                    </div>
                    {verifiedIds.has(m.id) && (
                      <div className="absolute top-3 left-10 rounded-full bg-green-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                        <ShieldCheck className="size-3" /> Verified
                      </div>
                    )}
                    {isNew && (
                      <div className="absolute top-3 left-10 rounded-full bg-white text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-glow flex items-center gap-1">
                        <Sparkles className="size-3" /> New
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters({
                          section: "establishments",
                          tab: "registered",
                          q: m.operator,
                        });
                      }}
                      className="text-sm font-medium text-left underline decoration-dotted underline-offset-2 hover:text-primary hover:decoration-solid transition-colors"
                    >
                      {m.operator}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      {m.date}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant={verifiedIds.has(m.id) ? "default" : "outline"}
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVerify(m.id);
                        }}
                        title={
                          verifiedIds.has(m.id)
                            ? "Mark as unverified"
                            : "Mark as verified"
                        }
                      >
                        {verifiedIds.has(m.id) ? (
                          <ShieldCheck className="size-4" />
                        ) : (
                          <Shield className="size-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        disabled={!!b}
                        onClick={() => setViewing(m)}
                        title="Preview & download"
                      >
                        <Download className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        disabled={!!b}
                        onClick={() => setForwardDialog([m.id])}
                        title="Forward"
                      >
                        {b === "forward" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Forward className="size-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setViewing(m)}
                        title="View"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })
        )}
      </div>
      <Pagination
        page={mPage}
        totalPages={mTotalPages}
        onPageChange={mSetPage}
        className="mt-4"
      />

      <AnimatePresence>
        {viewing && (
          <motion.div
            key="manifesto-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setViewing(null)}
            onKeyDown={(e) => e.key === "Escape" && setViewing(null)}
            tabIndex={-1}
            ref={(el) => {
              if (el) {
                el.focus();
                el.addEventListener("keydown", (e) => {
                  if (e.key === "Escape") setViewing(null);
                });
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl mx-4 my-8 rounded-2xl bg-card border border-border/60 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setViewing(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-background/80 backdrop-blur border border-border/60 p-2 text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              >
                <X className="size-5" />
              </button>

              <div className="aspect-video w-full gradient-primary relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.6), transparent 50%)",
                  }}
                />
                <div className="absolute bottom-6 left-6 text-primary-foreground">
                  <div className="text-sm opacity-80">
                    {viewing.date} · {viewing.operator}
                  </div>
                  <div className="text-3xl font-display font-bold">
                    {viewing.site}
                  </div>
                  <div className="mt-2 text-sm">
                    {viewing.divers} certified divers on the manifest
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Manifesto" value={viewing.id} />
                  <Field label="Operator" value={viewing.operator} />
                  <Field label="Site" value={viewing.site} />
                  <Field label="Date" value={viewing.date} />
                  <Field label="Divers" value={`${viewing.divers} certified`} />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => rowAction(viewing, "download")}
                  >
                    {rowBusy[viewing.id] === "download" ? (
                      <Loader2 className="size-4 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="size-4 mr-1.5" />
                    )}
                    Download
                  </Button>
                  <Button
                    className="flex-1 gradient-primary text-primary-foreground"
                    onClick={() => rowAction(viewing, "forward")}
                  >
                    <Forward className="size-4 mr-1.5" /> Forward
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={!!forwardDialog}
        onOpenChange={(o) => !o && setForwardDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="size-5 text-primary" /> Forward manifestos
            </DialogTitle>
          </DialogHeader>
          {forwardDialog && (
            <ForwardForm
              ids={forwardDialog}
              busy={forwardBusy}
              onConfirm={doForward}
              onCancel={() => setForwardDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ForwardForm({
  ids,
  busy,
  onConfirm,
  onCancel,
}: {
  ids: string[];
  busy: boolean;
  onConfirm: (ids: string[], recipients: string[], message: string) => void;
  onCancel: () => void;
}) {
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(
    new Set(),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const toggleRecipient = (email: string) =>
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });

  const confirm = () => {
    if (selectedRecipients.size === 0) {
      setError("Select at least one recipient.");
      return;
    }
    onConfirm(ids, [...selectedRecipients], message.trim());
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Forward{" "}
        <span className="font-medium text-foreground">
          {ids.length} manifesto{ids.length > 1 ? "s" : ""}
        </span>{" "}
        to selected recipients.
      </p>
      <div className="max-h-52 overflow-y-auto rounded-lg border border-border/70 divide-y divide-border/60">
        {FORWARD_RECIPIENTS.map((r) => {
          const checked = selectedRecipients.has(r.email);
          return (
            <label
              key={r.email}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-primary-soft/40 transition-colors"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleRecipient(r.email)}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {r.email}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <Label>Optional note</Label>
        <Textarea
          rows={2}
          placeholder="Add a message for the recipient…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={confirm}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Forward className="size-4 mr-1.5" />
          )}
          Forward to {selectedRecipients.size || ""} recipient
          {selectedRecipients.size !== 1 ? "s" : ""}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ------------------------------ DIVE SITE MANAGEMENT ------------------------------ */
export function DiveSiteMgmt({
  hideHeader = false,
  forcedTab,
}: {
  hideHeader?: boolean;
  forcedTab?: string;
} = {}) {
  const { canAct, deny } = usePermission();
  const { search, setFilters, resetFilters } = useFilters();
  const { scale } = useGlobalDateRange();
  const [viewing, setViewing] = useState<any>(null);
  const [sites, setSites] = useState(diveSites);
  const [addOpen, setAddOpen] = useState(false);
  const [newSite, setNewSite] = useState({
    name: "",
    barangay: "",
    depth: "",
    difficulty: "Open Water",
    type: "Reef",
    photo: "",
  });
  const [siteErrors, setSiteErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [drillSite, setDrillSite] = useState<any>(null);

  const filtered = useMemo(() => {
    return sites.filter((s) => {
      if (search.status !== "All" && s.status !== search.status) return false;
      if (search.difficulty !== "All" && s.difficulty !== search.difficulty)
        return false;
      if (search.siteType !== "All" && s.type !== search.siteType) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q) &&
          !s.barangay.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [sites, search.q, search.status, search.difficulty, search.siteType]);

  const scaledTopSites = useMemo(
    () =>
      topSites.map((s) => ({
        ...s,
        value: Math.round(s.value * Math.min(scale * 3, 1)),
      })),
    [scale],
  );

  const activeFilters: { key: string; label: string }[] = [];
  if (search.status !== "All")
    activeFilters.push({ key: "status", label: `Status: ${search.status}` });
  if (search.difficulty !== "All")
    activeFilters.push({
      key: "difficulty",
      label: `Difficulty: ${search.difficulty}`,
    });
  if (search.siteType !== "All")
    activeFilters.push({ key: "siteType", label: `Type: ${search.siteType}` });
  if (search.q)
    activeFilters.push({ key: "q", label: `Search: "${search.q}"` });

  const handleRemoveFilter = (key: string) => {
    if (key === "q") setFilters({ q: "" });
    else if (key === "status") setFilters({ status: "All" });
    else if (key === "difficulty") setFilters({ difficulty: "All" });
    else if (key === "siteType") setFilters({ siteType: "All" });
  };

  const validateSite = () => {
    const e: Record<string, string> = {};
    if (!newSite.name.trim()) e.name = "Site name is required";
    if (!newSite.barangay) e.barangay = "Select a barangay";
    if (!newSite.depth.trim()) e.depth = "Depth range is required";
    else if (
      !/^\d+(\.\d+)?\s*[–-]\s*\d+(\.\d+)?\s*m?$/i.test(newSite.depth.trim()) &&
      !/^\d+(\.\d+)?\s*m$/i.test(newSite.depth.trim())
    )
      e.depth = "e.g. 10–30 m or 15 m";
    if (!newSite.difficulty) e.difficulty = "Select difficulty";
    if (!newSite.type) e.type = "Select type";
    setSiteErrors(e);
    return Object.keys(e).length === 0;
  };

  const addSite = () => {
    if (!canAct) return deny();
    if (!validateSite())
      return toast.error("Please fix the highlighted fields");
    const site = {
      id: `DS-${String(sites.length + 1).padStart(3, "0")}`,
      ...newSite,
      name: newSite.name.trim(),
      depth: newSite.depth.trim(),
      status: "Active",
      dives: 0,
      description: "",
      lat: 13.75 + Math.random() * 0.02,
      lng: 120.92 + Math.random() * 0.03,
    };
    setSites((prev) => [site, ...prev]);
    setAddOpen(false);
    setNewSite({
      name: "",
      barangay: "",
      depth: "",
      difficulty: "Open Water",
      type: "Reef",
      photo: "",
    });
    setSiteErrors({});
    toast.success("Dive site added", {
      description: `${site.name} — ${site.barangay}`,
    });
  };

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image must be under 5 MB");
    const reader = new FileReader();
    reader.onload = () =>
      setNewSite((s) => ({ ...s, photo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const toggleStatus = (id: string) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next =
          s.status === "Active"
            ? "Restricted"
            : s.status === "Restricted"
              ? "Seasonal"
              : "Active";
        toast.info(`Status updated`, { description: `${s.name} → ${next}` });
        return { ...s, status: next };
      }),
    );
  };

  const effectiveTab =
    forcedTab ?? (search.tab === "analytics" ? "analytics" : "sites");

  return (
    <>
      <Tabs
        value={effectiveTab}
        onValueChange={(v) => setFilters({ tab: v })}
      >
        {!hideHeader && (
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="sites">Sites</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </div>
        )}

        <TabsContent value="sites" className="mt-0 space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or barangay…"
                  value={search.q}
                  onChange={(e) => setFilters({ q: e.target.value })}
                  className="pl-9"
                />
              </div>
              <Select
                value={search.status}
                onValueChange={(v) => setFilters({ status: v })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {["All", "Active", "Seasonal", "Restricted"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={search.difficulty}
                onValueChange={(v) => setFilters({ difficulty: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All difficulties</SelectItem>
                  {ALL_DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={search.siteType}
                onValueChange={(v) => setFilters({ siteType: v })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All types</SelectItem>
                  {ALL_SITE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({
                      q: "",
                      status: "All",
                      difficulty: "All",
                      siteType: "All",
                    })
                  }
                  className="text-muted-foreground"
                >
                  <X className="size-3.5 mr-1" /> Clear
                </Button>
              )}
              <Button
                className="ml-auto gradient-primary text-primary-foreground"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-4 mr-1.5" /> Add Site
              </Button>
            </div>
            <ActiveFilterBadges
              filters={activeFilters}
              onRemove={handleRemoveFilter}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            {filtered.length} of {sites.length} dive site
            {sites.length !== 1 ? "s" : ""}
          </div>

          <Card className="shadow-elegant overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Site ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Depth</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Total Dives</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No dive sites match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id} className="hover:bg-primary-soft/40">
                      <TableCell>
                        {s.photo ? (
                          <img
                            src={s.photo}
                            alt={s.name}
                            className="size-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="size-9 rounded-lg bg-gradient-to-br from-primary-soft to-secondary flex items-center justify-center">
                            <MapPin className="size-4 text-primary/50" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {s.id}
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.barangay}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {s.depth}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            s.difficulty === "Open Water"
                              ? "border-success/30 text-success"
                              : s.difficulty === "Advanced"
                                ? "border-primary/30 text-primary"
                                : s.difficulty === "Rescue"
                                  ? "border-warning/30 text-warning-foreground"
                                  : "border-destructive/30 text-destructive"
                          }
                        >
                          {s.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.type}</TableCell>
                      <TableCell>{s.dives}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            s.status === "Active"
                              ? "bg-success/10 text-success border-success/20"
                              : s.status === "Seasonal"
                                ? "bg-warning/15 text-warning-foreground border-warning/30"
                                : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewing(s)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleStatus(s.id)}
                          title="Cycle status"
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Detail Dialog */}
          <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Dive Site Details</DialogTitle>
              </DialogHeader>
              {viewing && (
                <div className="space-y-4">
                  {viewing.photo ? (
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-secondary">
                      <img
                        src={viewing.photo}
                        alt={viewing.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video rounded-xl gradient-primary relative overflow-hidden flex items-center justify-center">
                      <div
                        className="absolute inset-0 opacity-25"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 30% 30%, oklch(1 0 0 / 0.6), transparent 50%)",
                        }}
                      />
                      <MapPin className="size-16 text-primary-foreground/40" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                      <MapPin className="size-7" />
                    </div>
                    <div>
                      <div className="font-display text-lg font-semibold">
                        {viewing.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {viewing.id}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        viewing.status === "Active"
                          ? "bg-success/10 text-success border-success/20"
                          : viewing.status === "Seasonal"
                            ? "bg-warning/15 text-warning-foreground border-warning/30"
                            : "bg-muted text-muted-foreground border-border"
                      }
                    >
                      {viewing.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {viewing.description}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Field label="Barangay" value={viewing.barangay} />
                    <Field label="Depth Range" value={viewing.depth} />
                    <Field label="Difficulty" value={viewing.difficulty} />
                    <Field label="Type" value={viewing.type} />
                    <Field label="Total Dives" value={String(viewing.dives)} />
                    <Field
                      label="Trend"
                      value={`+${5 + Math.floor(Math.random() * 10)}%`}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setViewing(null);
                        toggleStatus(viewing.id);
                      }}
                    >
                      Toggle Status
                    </Button>
                    <Button
                      className="flex-1 gradient-primary text-primary-foreground"
                      onClick={() => setViewing(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Add Site Dialog */}
          <Dialog
            open={addOpen}
            onOpenChange={(o) => {
              setAddOpen(o);
              if (!o) setSiteErrors({});
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Dive Site</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoPick}
                />
                <div
                  className="relative rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group"
                  onClick={() => fileRef.current?.click()}
                >
                  {newSite.photo ? (
                    <>
                      <img
                        src={newSite.photo}
                        alt="Site photo"
                        className="w-full aspect-video object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewSite((s) => ({ ...s, photo: "" }));
                        }}
                        className="absolute top-2 right-2 size-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-sm font-medium text-foreground bg-background/80 rounded-lg px-3 py-1.5">
                          Change photo
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="size-10" />
                      <span className="text-sm font-medium">
                        Click to upload a photo
                      </span>
                      <span className="text-xs">JPG, PNG up to 5 MB</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>
                      Site Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newSite.name}
                      onChange={(e) =>
                        setNewSite({ ...newSite, name: e.target.value })
                      }
                      placeholder="e.g. Cathedral Point"
                      className={
                        siteErrors.name
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : ""
                      }
                    />
                    {siteErrors.name && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {siteErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Barangay <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={newSite.barangay}
                      onValueChange={(v) =>
                        setNewSite({ ...newSite, barangay: v })
                      }
                    >
                      <SelectTrigger
                        className={
                          siteErrors.barangay
                            ? "border-destructive focus-visible:ring-destructive/30"
                            : ""
                        }
                      >
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_BARANGAYS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {siteErrors.barangay && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {siteErrors.barangay}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Depth Range <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={newSite.depth}
                      onChange={(e) =>
                        setNewSite({ ...newSite, depth: e.target.value })
                      }
                      placeholder="e.g. 10–30 m"
                      className={
                        siteErrors.depth
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : ""
                      }
                    />
                    {siteErrors.depth && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {siteErrors.depth}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Difficulty <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={newSite.difficulty}
                      onValueChange={(v) =>
                        setNewSite({ ...newSite, difficulty: v })
                      }
                    >
                      <SelectTrigger
                        className={
                          siteErrors.difficulty
                            ? "border-destructive focus-visible:ring-destructive/30"
                            : ""
                        }
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_DIFFICULTIES.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {siteErrors.difficulty && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {siteErrors.difficulty}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={newSite.type}
                      onValueChange={(v) => setNewSite({ ...newSite, type: v })}
                    >
                      <SelectTrigger
                        className={
                          siteErrors.type
                            ? "border-destructive focus-visible:ring-destructive/30"
                            : ""
                        }
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_SITE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {siteErrors.type && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {siteErrors.type}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddOpen(false);
                      setSiteErrors({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gradient-primary text-primary-foreground"
                    onClick={addSite}
                  >
                    <Plus className="size-4 mr-1.5" /> Add Site
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <div className="space-y-6">
            <SectionCard title="Dive Site Heatmap — Mabini, Batangas">
              <ClientOnlyDiveSiteHeatmap sites={filtered} />
            </SectionCard>

              <SectionCard title="Site Usage This Month">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Rank</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Dives</TableHead>
                      <TableHead>Unique Divers</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Popularity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scaledTopSites.map((s, i) => (
                      <TableRow
                        key={s.name}
                        className="cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => setDrillSite(s)}
                      >
                        <TableCell className="font-mono">#{i + 1}</TableCell>
                        <TableCell className="font-medium flex items-center gap-2">
                          <MapPin className="size-4 text-primary" /> {s.name}
                        </TableCell>
                        <TableCell>{s.value}</TableCell>
                        <TableCell>{Math.round(s.value * 0.7)}</TableCell>
                        <TableCell>
                          <span className="text-success inline-flex items-center gap-0.5 text-xs">
                            <TrendingUp className="size-3" />+{5 + i * 2}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="w-40 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full gradient-primary"
                              style={{
                                width: `${(s.value / scaledTopSites[0].value) * 100}%`,
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionCard>
          </div>
        </TabsContent>
      </Tabs>

      <DrilldownDialog
        open={!!drillSite}
        onOpenChange={(o) => !o && setDrillSite(null)}
        title={drillSite?.name ?? ""}
        subtitle="Site analytics detail"
        stats={
          drillSite
            ? [
                { label: "Total dives", value: drillSite.value, icon: Waves },
                {
                  label: "Rank",
                  value: `#${topSites.indexOf(topSites.find((s) => s.name === drillSite.name) ?? topSites[0]) + 1}`,
                  icon: TrendingUp,
                },
                {
                  label: "Share",
                  value: `${((drillSite.value / topSites.reduce((a, s) => a + s.value, 0)) * 100).toFixed(1)}%`,
                  icon: BarChart3,
                },
              ]
            : undefined
        }
      >
        {drillSite &&
          (() => {
            const site = diveSites.find((s) => s.name === drillSite.name);
            return site ? (
              <div className="space-y-4 mt-2">
                <Card className="p-4 shadow-elegant">
                  <h4 className="font-display font-semibold text-sm mb-3">
                    Site information
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead>Property</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Barangay
                        </TableCell>
                        <TableCell className="font-medium">
                          {site.barangay}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Depth range
                        </TableCell>
                        <TableCell className="font-medium">
                          {site.depth}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Difficulty
                        </TableCell>
                        <TableCell className="font-medium">
                          {site.difficulty}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Type
                        </TableCell>
                        <TableCell className="font-medium">
                          {site.type}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Status
                        </TableCell>
                        <TableCell className="font-medium">
                          {site.status}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Unique divers
                        </TableCell>
                        <TableCell className="font-medium">
                          {Math.round(site.dives * 0.7)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Description
                        </TableCell>
                        <TableCell className="text-sm">
                          {site.description}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Card>
                <Card className="p-4 shadow-elegant">
                  <h4 className="font-display font-semibold text-sm mb-3">
                    Recent manifestos at this site
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead>ID</TableHead>
                        <TableHead>Operator</TableHead>
                        <TableHead>Divers</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manifestos
                        .filter((m) => m.site === site.name)
                        .map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-mono text-xs">
                              {m.id}
                            </TableCell>
                            <TableCell className="font-medium">
                              {m.operator}
                            </TableCell>
                            <TableCell>{m.divers}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {m.date}
                            </TableCell>
                          </TableRow>
                        ))}
                      {manifestos.filter((m) => m.site === site.name).length ===
                        0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-4"
                          >
                            No recent manifestos.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            ) : (
              <Card className="p-6 shadow-elegant mt-2 text-center text-muted-foreground">
                Site not found in registry.
              </Card>
            );
          })()}
      </DrilldownDialog>
    </>
  );
}

/* ------------------------------ OPERATOR ANALYTICS ------------------------------ */
export function OperatorAnalytics() {
  const { scale } = useGlobalDateRange();
  const { setFilters } = useFilters();
  const [drillOperator, setDrillOperator] = useState<any>(null);
  const scaledOperatorActivity = useMemo(
    () =>
      operatorActivity.map((o) => ({
        ...o,
        manifestos: Math.round(o.manifestos * Math.min(scale * 3, 1)),
        credits: Math.round(o.credits * Math.min(scale * 3, 1)),
      })),
    [scale],
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <SectionCard title="Most Active Operators">
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart
              data={scaledOperatorActivity}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 6"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="manifestos"
                fill="var(--color-primary)"
                radius={[0, 8, 8, 0]}
                onClick={(data: any) => data && setDrillOperator(data)}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Credits Used vs Manifestos">
        <div className="h-80">
          <ResponsiveContainer>
            <LineChart
              data={scaledOperatorActivity}
              margin={{ left: -12 }}
              onClick={(e) =>
                e?.activePayload?.[0]?.payload &&
                setDrillOperator(e.activePayload[0].payload)
              }
            >
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 6"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="credits"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-primary)" }}
              />
              <Line
                type="monotone"
                dataKey="manifestos"
                stroke="var(--color-primary-glow)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-primary-glow)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Operator Leaderboard" className="xl:col-span-2">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Operator</TableHead>
              <TableHead>Manifestos</TableHead>
              <TableHead>Credits Used</TableHead>
              <TableHead>Utilization</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scaledOperatorActivity.map((o) => (
              <TableRow
                key={o.name}
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setDrillOperator(o)}
              >
                <TableCell className="font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({
                        section: "establishments",
                        tab: "registered",
                        q: o.name,
                      });
                    }}
                    className="flex items-center gap-2 underline decoration-dotted underline-offset-2 hover:text-primary hover:decoration-solid transition-colors"
                  >
                    <Building2 className="size-4 text-primary" /> {o.name}
                  </button>
                </TableCell>
                <TableCell>{o.manifestos}</TableCell>
                <TableCell>{o.credits.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="w-40 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full gradient-primary"
                      style={{
                        width: `${(o.manifestos / scaledOperatorActivity[0].manifestos) * 100}%`,
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <DrilldownDialog
        open={!!drillOperator}
        onOpenChange={(o) => !o && setDrillOperator(null)}
        title={drillOperator?.name ?? ""}
        subtitle="Operator performance detail"
        stats={
          drillOperator
            ? [
                {
                  label: "Manifestos",
                  value: drillOperator.manifestos,
                  icon: ScrollText,
                },
                {
                  label: "Credits used",
                  value: drillOperator.credits.toLocaleString(),
                  icon: CreditCard,
                },
                {
                  label: "Utilization",
                  value: `${((drillOperator.manifestos / drillOperator.credits) * 100).toFixed(0)}%`,
                  icon: TrendingUp,
                },
              ]
            : undefined
        }
      >
        {drillOperator && (
          <div className="space-y-4 mt-2">
            <Card className="p-4 shadow-elegant">
              <h4 className="font-display font-semibold text-sm mb-3">
                Operator summary
              </h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Total manifestos filed
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {drillOperator.manifestos}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Credits purchased
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {drillOperator.credits.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Credits remaining
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(
                        drillOperator.credits -
                        Math.round(drillOperator.manifestos * 18.5)
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Avg divers per manifest
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(
                        Math.round(drillOperator.manifestos * 7.2) /
                        drillOperator.manifestos
                      ).toFixed(1)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      Revenue generated
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₱{(drillOperator.manifestos * 4200).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
            <Card className="p-4 shadow-elegant">
              <h4 className="font-display font-semibold text-sm mb-3">
                Recent manifestos
              </h4>
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>ID</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Divers</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manifestos
                    .filter((m) =>
                      m.operator.includes(drillOperator.name.split(" ")[0]),
                    )
                    .slice(0, 5)
                    .map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">
                          {m.id}
                        </TableCell>
                        <TableCell className="font-medium">{m.site}</TableCell>
                        <TableCell>{m.divers}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.date}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </DrilldownDialog>
    </div>
  );
}

/* ------------------------------ REPORTS ------------------------------ */
export function Reports() {
  const {
    visibleMonths,
    globalDateFrom,
    globalDateTo,
    setRange: setGlobalRange,
  } = useGlobalDateRange();
  const [range, setRange] = useState("monthly");
  const [dateFrom, setDateFrom] = useState(globalDateFrom);
  const [dateTo, setDateTo] = useState(globalDateTo);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);

  const filteredTrends = useMemo(
    () => monthlyTrends.filter((d) => visibleMonths.includes(d.m)),
    [visibleMonths],
  );

  const generateReport = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const data =
      range === "daily"
        ? [
            {
              period: "Jul 25",
              tourists: 42,
              operators: 8,
              manifestos: 18,
              dives: 64,
              revenue: "₱126,400",
            },
            {
              period: "Jul 24",
              tourists: 38,
              operators: 7,
              manifestos: 15,
              dives: 56,
              revenue: "₱112,200",
            },
            {
              period: "Jul 23",
              tourists: 35,
              operators: 9,
              manifestos: 20,
              dives: 72,
              revenue: "₱138,800",
            },
          ]
        : range === "weekly"
          ? [
              {
                period: "Week 30",
                tourists: 280,
                operators: 12,
                manifestos: 95,
                dives: 380,
                revenue: "₱892,000",
              },
              {
                period: "Week 29",
                tourists: 245,
                operators: 11,
                manifestos: 82,
                dives: 328,
                revenue: "₱765,000",
              },
              {
                period: "Week 28",
                tourists: 310,
                operators: 14,
                manifestos: 104,
                dives: 416,
                revenue: "₱948,000",
              },
            ]
          : [
              {
                period: "Jul 2026",
                tourists: 1240,
                operators: 18,
                manifestos: 420,
                dives: 1680,
                revenue: "₱3,842,000",
              },
              {
                period: "Jun 2026",
                tourists: 1180,
                operators: 17,
                manifestos: 398,
                dives: 1592,
                revenue: "₱3,610,000",
              },
              {
                period: "May 2026",
                tourists: 1050,
                operators: 16,
                manifestos: 360,
                dives: 1440,
                revenue: "₱3,280,000",
              },
            ];
    setReportData(data);
    setGenerating(false);
    toast.success(`${range} report generated`, {
      description: `${data.length} periods included.`,
    });
  };

  const exportReport = (fmt: string) => {
    if (!reportData) return toast.error("Generate a report first");
    if (fmt === "CSV") {
      const header = "Period,Tourists,Operators,Manifestos,Dives,Revenue";
      const rows = reportData.map(
        (r) =>
          `${r.period},${r.tourists},${r.operators},${r.manifestos},${r.dives},"${r.revenue}"`,
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${range}-${dateFrom || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported", { description: "CSV downloaded." });
    } else {
      toast.success(`Exported as ${fmt}`, {
        description: "File saved to your device.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-elegant">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h3 className="font-display font-semibold text-lg">
              Generate report
            </h3>
            <p className="text-sm text-muted-foreground">
              Aggregate tourism data across configurable time windows.
            </p>
          </div>
          <div className="md:ml-auto flex flex-wrap items-center gap-2">
            <Tabs value={range} onValueChange={setRange}>
              <TabsList className="bg-secondary">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                From
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                To
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={generateReport}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <FileBarChart className="size-4 mr-1.5" />
              )}
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: ImageIcon,
            label: "Export as PNG",
            desc: "Share a visual snapshot",
            fmt: "PNG",
          },
          {
            icon: FileText,
            label: "Export as PDF",
            desc: "Formal, print-ready summary",
            fmt: "PDF",
          },
          {
            icon: FileDown,
            label: "Export as CSV",
            desc: "Raw data for analysis",
            fmt: "CSV",
          },
        ].map((x) => (
          <Card
            key={x.label}
            className="p-5 shadow-elegant border-border/60 hover:border-primary/30 hover:shadow-glow transition-all cursor-pointer group"
            onClick={() => exportReport(x.fmt)}
          >
            <div className="size-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center group-hover:gradient-primary group-hover:text-primary-foreground transition-colors">
              <x.icon className="size-5" />
            </div>
            <div className="mt-4 font-display font-semibold">{x.label}</div>
            <div className="text-sm text-muted-foreground">{x.desc}</div>
          </Card>
        ))}
      </div>

      {reportData && (
        <SectionCard
          title={`Report preview — ${range.charAt(0).toUpperCase() + range.slice(1)}`}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Period</TableHead>
                <TableHead>Tourists</TableHead>
                <TableHead>Operators</TableHead>
                <TableHead>Manifestos</TableHead>
                <TableHead>Dives</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell>{r.tourists.toLocaleString()}</TableCell>
                  <TableCell>{r.operators}</TableCell>
                  <TableCell>{r.manifestos.toLocaleString()}</TableCell>
                  <TableCell>{r.dives.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">
                    {r.revenue}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      <SectionCard title="Trend — Monthly dives">
        <div className="h-80">
          <ResponsiveContainer>
            <AreaChart data={filteredTrends} margin={{ left: -12 }}>
              <defs>
                <linearGradient id="rpt" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 6"
                vertical={false}
              />
              <XAxis
                dataKey="m"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="dives"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#rpt)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------ ANNOUNCEMENTS ------------------------------ */
function Announcements() {
  const { canAct, deny } = usePermission();
  type Announcement = {
    id: number;
    title: string;
    body: string;
    when: string;
    status: "Published" | "Scheduled" | "Draft" | "Archived";
    audience?: { nat: string[]; ops: string[]; lvls: string[] };
  };
  const [items, setItems] = useState<Announcement[]>([
    {
      id: 1,
      title: "New safety guidelines for night dives",
      body: "All operators must brief divers on updated protocols before departure.",
      when: "Today · 10:24",
      status: "Published",
    },
    {
      id: 2,
      title: "Blue Hole temporary closure Aug 3–5",
      body: "Site closed for reef restoration. Please redirect scheduled dives.",
      when: "Yesterday",
      status: "Published",
    },
    {
      id: 3,
      title: "Seasonal jellyfish advisory",
      body: "Increased jellyfish activity near the coral garden area. Proceed with caution and carry sting kits.",
      when: "Jul 22",
      status: "Draft",
    },
    {
      id: 4,
      title: "New dive shop licensing fees effective Aug 1",
      body: "Updated fee schedule published. All operators must renew under the new rates before end of August.",
      when: "Jul 20",
      status: "Published",
    },
    {
      id: 5,
      title: "Emergency drill scheduled Aug 10",
      body: "All operators in Barangays San Teodoro and Solo are required to participate in the annual safety drill.",
      when: "Jul 18",
      status: "Archived",
    },
  ]);
  const [draft, setDraft] = useState({
    title: "",
    body: "",
    schedule: "",
    scheduleTime: "",
    nat: [] as string[],
    ops: [] as string[],
    lvls: [] as string[],
  });
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [editDraft, setEditDraft] = useState({ title: "", body: "" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    if (filter === "All") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const openEdit = (item: any) => {
    setEditItem(item);
    setEditDraft({ title: item.title, body: item.body });
    setEditErrors({});
  };

  const saveEdit = () => {
    const e: Record<string, string> = {};
    if (!editDraft.title.trim()) e.title = "Title is required";
    if (!editDraft.body.trim()) e.body = "Body is required";
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;
    setItems(
      items.map((i) =>
        i.id === editItem.id
          ? { ...i, title: editDraft.title.trim(), body: editDraft.body.trim() }
          : i,
      ),
    );
    setEditItem(null);
    toast.success("Announcement updated");
  };

  const publishDraft = () => {
    if (!canAct) return deny();
    const e: Record<string, string> = {};
    if (!draft.title.trim()) e.title = "Title is required";
    if (!draft.body.trim()) e.body = "Body is required";
    if (draft.schedule && !draft.scheduleTime)
      e.scheduleTime = "Set a time to send";
    setDraftErrors(e);
    if (Object.keys(e).length > 0) return;
    const scheduled = draft.schedule !== "";
    const status = scheduled ? "Scheduled" : "Published";
    setItems([
      {
        id: Date.now(),
        title: draft.title.trim(),
        body: draft.body.trim(),
        when: scheduled
          ? `${draft.schedule} · ${draft.scheduleTime}`
          : "Just now",
        status,
        audience: { nat: draft.nat, ops: draft.ops, lvls: draft.lvls },
      },
      ...items,
    ]);
    setDraft({
      title: "",
      body: "",
      schedule: "",
      scheduleTime: "",
      nat: [],
      ops: [],
      lvls: [],
    });
    setDraftErrors({});
    toast.success(
      scheduled ? "Announcement scheduled" : "Announcement published",
      {
        description: scheduled
          ? `Queued to send on ${draft.schedule} at ${draft.scheduleTime}.`
          : undefined,
      },
    );
    pushAuditLog(
      scheduled
        ? `Scheduled announcement #A-${Date.now() % 1000}`
        : `Pushed announcement #A-${Date.now() % 1000}`,
    );
    pushNotif({
      id: `n-ann-${Date.now()}`,
      kind: "announcement",
      title: scheduled ? "Announcement scheduled" : "Announcement published",
      detail: `${draft.title.trim()} — ${scheduled ? `sending ${draft.schedule} at ${draft.scheduleTime}` : "sent to targeted audience"}.`,
      section: "announcements",
      at: "Just now",
    });
  };

  const toggleChip = (key: "nat" | "ops" | "lvls", val: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(val)
        ? d[key].filter((x) => x !== val)
        : [...d[key], val],
    }));

  const statusBadge = (s: string) => {
    if (s === "Published")
      return (
        <Badge className="bg-success/15 text-success border-success/20 text-[10px]">
          Published
        </Badge>
      );
    if (s === "Scheduled")
      return (
        <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] flex items-center gap-1">
          <Clock className="size-3" />
          Scheduled
        </Badge>
      );
    if (s === "Draft")
      return (
        <Badge className="bg-warning/15 text-warning border-warning/20 text-[10px]">
          Draft
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        Archived
      </Badge>
    );
  };

  const audienceSummary = (a?: {
    nat: string[];
    ops: string[];
    lvls: string[];
  }) => {
    if (!a) return null;
    const parts: string[] = [];
    if (a.nat.length > 0)
      parts.push(`${a.nat.length} nationalit${a.nat.length > 1 ? "ies" : "y"}`);
    if (a.ops.length > 0)
      parts.push(`${a.ops.length} operator${a.ops.length > 1 ? "s" : ""}`);
    if (a.lvls.length > 0)
      parts.push(`${a.lvls.length} level${a.lvls.length > 1 ? "s" : ""}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search announcements…"
              value={filter === "All" ? "" : ""}
              onChange={() => {}}
              className="pl-9"
              disabled
            />
          </div>
          <div className="flex gap-2">
            {["All", "Published", "Scheduled", "Draft", "Archived"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? "default" : "outline"}
                className={
                  filter === s ? "gradient-primary text-primary-foreground" : ""
                }
                onClick={() => setFilter(s)}
              >
                {s}{" "}
                {s !== "All" && (
                  <span className="ml-1 text-[10px] opacity-70">
                    ({items.filter((i) => s === "All" || i.status === s).length}
                    )
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground shadow-elegant">
            <Megaphone className="size-10 mx-auto mb-3 opacity-40" />
            No announcements match this filter.
          </Card>
        ) : (
          filtered.map((i) => (
            <Card
              key={i.id}
              className="p-5 shadow-elegant border-border/60 transition-all hover:shadow-glow"
            >
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Megaphone className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display font-semibold">{i.title}</h4>
                    {statusBadge(i.status)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {i.status === "Scheduled" && (
                        <CalendarClock className="size-3 text-primary" />
                      )}
                      {i.when}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{i.body}</p>
                  {audienceSummary(i.audience) && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground">
                      <Users2 className="size-3 text-primary" />
                      Targets {audienceSummary(i.audience)}
                    </div>
                  )}
                  <div className="mt-3 flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(i)}
                    >
                      <Edit3 className="size-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/30 text-destructive"
                      onClick={() => {
                        setItems(items.filter((x) => x.id !== i.id));
                        toast.success("Announcement deleted");
                      }}
                    >
                      <Trash2 className="size-4 mr-1" /> Delete
                    </Button>
                    {i.status === "Draft" && (
                      <Button
                        size="sm"
                        className="ml-auto gradient-primary text-primary-foreground"
                        onClick={() => {
                          setItems(
                            items.map((x) =>
                              x.id === i.id ? { ...x, status: "Published" } : x,
                            ),
                          );
                          toast.success("Announcement published");
                          pushAuditLog(`Pushed announcement #A-${i.id}`);
                        }}
                      >
                        <Send className="size-4 mr-1" /> Publish
                      </Button>
                    )}
                    {i.status === "Scheduled" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto"
                          onClick={() => {
                            setItems(
                              items.map((x) =>
                                x.id === i.id
                                  ? { ...x, status: "Draft", when: "Draft" }
                                  : x,
                              ),
                            );
                            toast.info("Schedule cancelled", {
                              description: "Moved back to drafts.",
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="gradient-primary text-primary-foreground"
                          onClick={() => {
                            setItems(
                              items.map((x) =>
                                x.id === i.id
                                  ? {
                                      ...x,
                                      status: "Published",
                                      when: "Just now",
                                    }
                                  : x,
                              ),
                            );
                            toast.success("Sent now", { description: i.title });
                            pushAuditLog(`Pushed announcement #A-${i.id}`);
                          }}
                        >
                          <Send className="size-4 mr-1" /> Send now
                        </Button>
                      </>
                    )}
                    {i.status === "Published" && (
                      <Button
                        size="sm"
                        className="ml-auto gradient-primary text-primary-foreground"
                        onClick={() =>
                          toast.success("Pushed to tourists", {
                            description: i.title,
                          })
                        }
                      >
                        <Send className="size-4 mr-1" /> Push to Tourists
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <Card className="p-5 shadow-elegant h-fit sticky top-24">
          <h3 className="font-display font-semibold mb-3">New announcement</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Manta season update"
                className={
                  draftErrors.title
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {draftErrors.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {draftErrors.title}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Body <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Write your message…"
                rows={4}
                className={
                  draftErrors.body
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {draftErrors.body && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {draftErrors.body}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/70 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Send later</Label>
                <Switch
                  checked={draft.schedule !== ""}
                  onCheckedChange={(v) =>
                    setDraft({
                      ...draft,
                      schedule: v ? "2026-07-26" : "",
                      scheduleTime: v ? "08:00" : "",
                    })
                  }
                />
              </div>
              {draft.schedule !== "" && (
                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Date
                    </Label>
                    <Input
                      type="date"
                      value={draft.schedule}
                      onChange={(e) =>
                        setDraft({ ...draft, schedule: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Time
                    </Label>
                    <Input
                      type="time"
                      value={draft.scheduleTime}
                      onChange={(e) =>
                        setDraft({ ...draft, scheduleTime: e.target.value })
                      }
                      className={
                        draftErrors.scheduleTime
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : ""
                      }
                    />
                  </div>
                </div>
              )}
              {draftErrors.scheduleTime && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {draftErrors.scheduleTime}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/70 p-3 space-y-2.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Users2 className="size-3.5 text-primary" /> Audience targeting
              </Label>
              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Nationalities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_NATIONALITIES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleChip("nat", n)}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${draft.nat.includes(n) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Dive level
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_LEVELS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleChip("lvls", n)}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${draft.lvls.includes(n) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Operators
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_OPERATOR_BIZ.slice(0, 8).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleChip("ops", n)}
                      className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${draft.ops.includes(n) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={publishDraft}
            >
              {draft.schedule !== "" ? (
                <CalendarClock className="size-4 mr-1.5" />
              ) : (
                <Plus className="size-4 mr-1.5" />
              )}
              {draft.schedule !== "" ? "Schedule" : "Publish"}
            </Button>
          </div>
        </Card>
        <Card className="p-5 shadow-elegant">
          <h3 className="font-display font-semibold mb-3 text-sm">Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Published</span>
              <span className="font-medium">
                {items.filter((i) => i.status === "Published").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled</span>
              <span className="font-medium">
                {items.filter((i) => i.status === "Scheduled").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Drafts</span>
              <span className="font-medium">
                {items.filter((i) => i.status === "Draft").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Archived</span>
              <span className="font-medium">
                {items.filter((i) => i.status === "Archived").length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={editDraft.title}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, title: e.target.value })
                }
                className={
                  editErrors.title
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {editErrors.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {editErrors.title}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Body <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={editDraft.body}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, body: e.target.value })
                }
                rows={5}
                className={
                  editErrors.body
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              {editErrors.body && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {editErrors.body}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button
                className="gradient-primary text-primary-foreground"
                onClick={saveEdit}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------ SETTINGS ------------------------------ */
const SESSION_TIMEOUT_OPTIONS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "5 minutes", value: 300 },
  { label: "10 minutes", value: 600 },
  { label: "15 minutes", value: 900 },
  { label: "30 minutes", value: 1800 },
  { label: "Never", value: 0 },
];

function SessionTimeoutSetting() {
  const [timeout, setTimeout_] = useState(() => {
    try {
      return Number(localStorage.getItem("session-timeout") ?? "600");
    } catch {
      return 600;
    }
  });

  const handleChange = (v: string) => {
    const val = Number(v);
    setTimeout_(val);
    try {
      localStorage.setItem("session-timeout", String(val));
    } catch {}
    if (val === 0) {
      toast.success("Session timeout disabled");
    } else {
      const opt = SESSION_TIMEOUT_OPTIONS.find((o) => o.value === val);
      toast.success(`Session timeout set to ${opt?.label ?? val + "s"}`);
    }
  };

  return (
    <Select value={String(timeout)} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px] h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SESSION_TIMEOUT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={String(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SettingsPage() {
  const { canAct, canAdmin, deny } = usePermission();
  const [users, setUsers] = useState([
    {
      id: "U-001",
      name: "Admin Kalua",
      email: "admin@reef.gov",
      role: "Admin",
      status: "Active",
      lastActive: "2 min ago",
      actionsToday: 23,
    },
    {
      id: "U-002",
      name: "Clerk Mendez",
      email: "clerk@reef.gov",
      role: "Clerk",
      status: "Active",
      lastActive: "1 hour ago",
      actionsToday: 9,
    },
    {
      id: "U-003",
      name: "Officer Sato",
      email: "officer@reef.gov",
      role: "Officer",
      status: "Active",
      lastActive: "Yesterday",
      actionsToday: 4,
    },
    {
      id: "U-004",
      name: "Clerk Reyes",
      email: "clerk2@reef.gov",
      role: "Clerk",
      status: "Suspended",
      lastActive: "3 days ago",
      actionsToday: 0,
    },
  ]);
  const [userDialog, setUserDialog] = useState<"add" | any>(null);
  const [userDraft, setUserDraft] = useState({
    name: "",
    email: "",
    role: "Clerk",
  });
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});

  const addUser = () => {
    if (!canAct) return deny();
    const e: Record<string, string> = {};
    if (!userDraft.name.trim()) e.name = "Name is required";
    if (!userDraft.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(userDraft.email)) e.email = "Invalid email";
    else if (users.some((u) => u.email === userDraft.email))
      e.email = "Email already exists";
    setUserErrors(e);
    if (Object.keys(e).length > 0) return;
    setUsers([
      ...users,
      {
        id: `U-${String(users.length + 1).padStart(3, "0")}`,
        ...userDraft,
        name: userDraft.name.trim(),
        email: userDraft.email.trim(),
        status: "Active",
        lastActive: "Just now",
        actionsToday: 0,
      },
    ]);
    setUserDialog(null);
    setUserDraft({ name: "", email: "", role: "Clerk" });
    toast.success("User added", {
      description: `${userDraft.name} — ${userDraft.role}`,
    });
  };

  const toggleUserStatus = (id: string) => {
    if (!canAct) return deny();
    setUsers(
      users.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" }
          : u,
      ),
    );
    const u = users.find((x) => x.id === id);
    toast.success(
      `User ${u?.status === "Active" ? "suspended" : "activated"}`,
      { description: u?.name },
    );
  };

  const deleteUser = (id: string) => {
    if (!canAct) return deny();
    const u = users.find((x) => x.id === id);
    setUsers(users.filter((x) => x.id !== id));
    toast.success("User removed", { description: u?.name });
  };

  const setUserRole = (id: string, role: string) => {
    if (!canAdmin) return deny("Only Super Admin can change user roles.");
    setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
    const u = users.find((x) => x.id === id);
    toast.success("Role updated", { description: `${u?.name} is now ${role}` });
  };

  const [auditQ, setAuditQ] = useState("");
  const [auditUser, setAuditUser] = useState("All");
  const [auditType, setAuditType] = useState("All");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");

  const logs = useLiveAuditLogs();
  const uniqueAuditUsers = useMemo(
    () => [...new Set(logs.map((l) => l.who))].sort(),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (auditUser !== "All" && l.who !== auditUser) return false;
      if (auditType !== "All" && auditActionType(l.action) !== auditType)
        return false;
      if (auditDateFrom && l.date < auditDateFrom) return false;
      if (auditDateTo && l.date > auditDateTo) return false;
      if (auditQ) {
        const q = auditQ.toLowerCase();
        if (
          !l.who.toLowerCase().includes(q) &&
          !l.action.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [logs, auditQ, auditUser, auditType, auditDateFrom, auditDateTo]);

  const {
    page: aPage,
    setPage: aSetPage,
    totalPages: aTotalPages,
    paged: aPaged,
  } = usePagination(filteredLogs, 10);

  const exportCsv = () => {
    const header = "Date,Time,User,Action,Type";
    const rows = filteredLogs.map(
      (l) =>
        `${l.date},${l.t},"${l.who}","${l.action.replace(/"/g, '""')}","${auditActionType(l.action)}"`,
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${auditDateFrom || "all"}${auditDateTo ? `-to-${auditDateTo}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit logs exported", {
      description: `${filteredLogs.length} entries saved as CSV.`,
    });
  };

  return (
    <Tabs defaultValue="users">
      <TabsList className="bg-secondary">
        <TabsTrigger value="users">Manage Users</TabsTrigger>
        <TabsTrigger value="config">System Configuration</TabsTrigger>
        <TabsTrigger value="audit">Audit Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={() => {
              setUserDialog("add");
              setUserDraft({ name: "", email: "", role: "Clerk" });
              setUserErrors({});
            }}
          >
            <Plus className="size-4 mr-1.5" /> Add User
          </Button>
          <span className="text-xs text-muted-foreground">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Card className="shadow-elegant overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="flex items-center gap-3 py-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {u.name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canAdmin ? (
                      <Select
                        value={u.role}
                        onValueChange={(v) => setUserRole(u.id, v)}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Admin", "Officer", "Clerk"].map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-primary/30 text-primary"
                      >
                        {u.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.status === "Active" ? (
                      <Badge className="bg-success/15 text-success border-success/20 text-[10px]">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-[10px]">
                        Suspended
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground">
                        {u.lastActive}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                        <Activity className="size-3" />
                        {u.actionsToday} action{u.actionsToday === 1 ? "" : "s"}{" "}
                        today
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleUserStatus(u.id)}
                        title={u.status === "Active" ? "Suspend" : "Activate"}
                      >
                        {u.status === "Active" ? (
                          <XCircle className="size-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="size-4 text-success" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteUser(u.id)}
                        title="Remove"
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog
          open={!!userDialog}
          onOpenChange={(o) => {
            if (!o) {
              setUserDialog(null);
              setUserErrors({});
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add user</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={userDraft.name}
                  onChange={(e) =>
                    setUserDraft({ ...userDraft, name: e.target.value })
                  }
                  placeholder="e.g. Juan Dela Cruz"
                  className={
                    userErrors.name
                      ? "border-destructive focus-visible:ring-destructive/30"
                      : ""
                  }
                />
                {userErrors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {userErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={userDraft.email}
                  onChange={(e) =>
                    setUserDraft({ ...userDraft, email: e.target.value })
                  }
                  placeholder="user@reef.gov"
                  className={
                    userErrors.email
                      ? "border-destructive focus-visible:ring-destructive/30"
                      : ""
                  }
                />
                {userErrors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {userErrors.email}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={userDraft.role}
                  onValueChange={(v) => setUserDraft({ ...userDraft, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Admin", "Officer", "Clerk"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUserDialog(null);
                    setUserErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="gradient-primary text-primary-foreground"
                  onClick={addUser}
                >
                  <Plus className="size-4 mr-1.5" /> Add User
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </TabsContent>

      <TabsContent value="config" className="mt-4">
        <Card className="p-6 shadow-elegant space-y-4 max-w-2xl">
          {[
            {
              l: "Require 2FA for admins",
              d: "Enforce two-factor authentication",
            },
            {
              l: "Auto-approve verified operators",
              d: "Skip manual review for pre-verified applications",
            },
            {
              l: "Push announcements to mobile app",
              d: "Send notifications to all registered tourists",
            },
            {
              l: "Weekly report email digest",
              d: "Send summary reports to configured recipients",
            },
          ].map((s, i) => (
            <div
              key={s.l}
              className="flex items-center justify-between py-2 border-b border-border"
            >
              <div>
                <div className="font-medium">{s.l}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </div>
              <Switch defaultChecked={i % 2 === 0} />
            </div>
          ))}

          <div className="pt-2">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">Session Timeout</div>
                <div className="text-sm text-muted-foreground">
                  Auto-logout after a period of inactivity
                </div>
              </div>
              <SessionTimeoutSetting />
            </div>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="audit" className="mt-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user or action…"
              value={auditQ}
              onChange={(e) => setAuditQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={auditUser} onValueChange={setAuditUser}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All users</SelectItem>
              {uniqueAuditUsers.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={auditType} onValueChange={setAuditType}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "All" ? "All action types" : t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              From
            </Label>
            <Input
              type="date"
              value={auditDateFrom}
              onChange={(e) => setAuditDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input
              type="date"
              value={auditDateTo}
              onChange={(e) => setAuditDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" onClick={exportCsv} className="ml-auto">
            <FileDown className="size-4 mr-1.5" /> Export CSV
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredLogs.length} of {logs.length} log
          {logs.length !== 1 ? "s" : ""}
        </div>
        <Card className="shadow-elegant overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No audit logs match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                aPaged.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">
                      {l.date}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {l.t}
                    </TableCell>
                    <TableCell>{l.who}</TableCell>
                    <TableCell>{l.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground font-normal"
                      >
                        {auditActionType(l.action)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={aPage}
            totalPages={aTotalPages}
            onPageChange={aSetPage}
            className="mt-4"
          />
        </Card>
      </TabsContent>
    </Tabs>
  );
}
