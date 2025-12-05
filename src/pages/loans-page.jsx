import { useMemo, useState } from "react";

import { getSemesterFromDate } from "../lib/mock-data.js";

import {
  Calendar,
  CheckCircle,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { useAuth } from "../context/auth-context.jsx";
import { mockAssets, mockLoans, getAcademicYear } from "../lib/mock-data.js"; // TAMBAHKAN IMPORT getAcademicYear

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";

const CREATOR_ROLES = ["mahasiswa", "dosen", "staf"];
const APPROVER_ROLES = ["staf_buf", "admin_buf"];

const STATUS_BADGES = {
  menunggu: { variant: "secondary", label: "Menunggu" },
  disetujui: { variant: "default", label: "Disetujui" },
  ditolak: { variant: "destructive", label: "Ditolak" },
  selesai: { variant: "outline", label: "Selesai" },
};

export function LoansPage() {
  const { user } = useAuth();

  const [loans, setLoans] = useState(mockLoans);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [isFacilityFormOpen, setIsFacilityFormOpen] = useState(false);

  const canApprove = APPROVER_ROLES.includes(user?.role ?? "");
  const canCreateLoan = CREATOR_ROLES.includes(user?.role ?? "");

  const filteredLoans = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return loans.filter((loan) => {
      const matchesSearch =
        loan.borrowerName.toLowerCase().includes(keyword) ||
        (loan.roomName && loan.roomName.toLowerCase().includes(keyword)) ||
        loan.facilities.some((facility) =>
          facility.name.toLowerCase().includes(keyword)
        );

      const matchesStatus =
        statusFilter === "all" || loan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [loans, searchTerm, statusFilter]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
  };

  const handleCreateLoan = (payload) => {
    const timestamp = new Date().toISOString();

    setLoans((prev) => [
      ...prev,
      {
        id: `l${prev.length + 1}`,
        borrowerId: user?.id ?? "",
        borrowerName: user?.name ?? "Pengguna",
        roomId: payload.roomId,
        roomName: payload.roomName,
        facilities: payload.facilities ?? [],
        startDate: payload.startDate ?? "",
        endDate: payload.endDate ?? "",
        status: "menunggu",
        purpose: payload.purpose ?? "",
        academicYear: payload.academicYear || getAcademicYear(), // TAMBAHKAN academicYear
        semester:
          payload.semester ||
          getSemesterFromDate(payload.startDate || new Date()), // TAMBAHKAN SEMESTER
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]);
  };

  const updateLoanStatus = (id, status) => {
    const timestamp = new Date().toISOString();
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === id ? { ...loan, status, updatedAt: timestamp } : loan
      )
    );
  };

  const renderStatusBadge = (status) => {
    const config = STATUS_BADGES[status] ?? STATUS_BADGES.menunggu;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Peminjaman Aset</h1>
          <p className="text-muted-foreground mt-2">
            {canApprove
              ? "Kelola permintaan peminjaman aset"
              : "Ajukan dan lihat status peminjaman Anda"}
          </p>
        </div>

        {canCreateLoan && (
          <div className="flex flex-wrap gap-2">
            <Dialog open={isRoomFormOpen} onOpenChange={setIsRoomFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Pinjam Ruangan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajukan Peminjaman Ruangan</DialogTitle>
                  <DialogDescription>
                    Lengkapi form berikut untuk mengajukan peminjaman ruangan
                    beserta fasilitas pendukungnya.
                  </DialogDescription>
                </DialogHeader>
                <RoomLoanForm
                  onSubmit={(payload) => {
                    handleCreateLoan(payload);
                    setIsRoomFormOpen(false);
                  }}
                  onCancel={() => setIsRoomFormOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Dialog
              open={isFacilityFormOpen}
              onOpenChange={setIsFacilityFormOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 size-4" />
                  Pinjam Fasilitas
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajukan Peminjaman Fasilitas</DialogTitle>
                  <DialogDescription>
                    Ajukan peminjaman fasilitas untuk menunjang kegiatan Anda.
                  </DialogDescription>
                </DialogHeader>
                <FacilityLoanForm
                  onSubmit={(payload) => {
                    handleCreateLoan(payload);
                    setIsFacilityFormOpen(false);
                  }}
                  onCancel={() => setIsFacilityFormOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="size-5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Cari aset atau peminjam..."
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status peminjaman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="menunggu">Menunggu</SelectItem>
                <SelectItem value="disetujui">Disetujui</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {canApprove && <TableHead>Peminjam</TableHead>}
                  <TableHead>Detail Aset</TableHead>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableHead>Tanggal Selesai</TableHead>
                  <TableHead>Status</TableHead>
                  {canApprove && <TableHead>Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canApprove ? 6 : 5}
                      className="text-center text-muted-foreground"
                    >
                      Tidak ada peminjaman ditemukan
                    </TableCell>
                  </TableRow>
                )}

                {filteredLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    {canApprove && <TableCell>{loan.borrowerName}</TableCell>}
                    <TableCell>
                      <LoanAssetDetails loan={loan} />
                    </TableCell>
                    <TableCell>
                      <LoanDate value={loan.startDate} time={loan.startTime} />
                    </TableCell>
                    <TableCell>
                      <LoanDate value={loan.endDate} time={loan.endTime} />
                    </TableCell>
                    <TableCell>{renderStatusBadge(loan.status)}</TableCell>
                    {canApprove && loan.status === "menunggu" && (
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateLoanStatus(loan.id, "disetujui")
                            }
                          >
                            <CheckCircle className="mr-1 size-4 text-green-600" />
                            Setuju
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateLoanStatus(loan.id, "ditolak")}
                          >
                            <XCircle className="mr-1 size-4 text-red-600" />
                            Tolak
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoanAssetDetails({ loan }) {
  return (
    <div className="space-y-1">
      {loan.roomName && <p>Ruangan: {loan.roomName}</p>}
      {loan.facilities.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <p>Fasilitas:</p>
          <ul className="list-inside list-disc">
            {loan.facilities.map((facility, index) => (
              <li key={`${loan.id}-${facility.id}-${index}`}>
                {facility.name} ({facility.quantity}x)
              </li>
            ))}
          </ul>
        </div>
      )}
      {loan.purpose && (
        <p className="text-sm text-muted-foreground">
          Keperluan: {loan.purpose}
        </p>
      )}
    </div>
  );
}

function LoanDate({ value, time }) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="size-4 text-muted-foreground" />
      <div>
        <div>{new Date(value).toLocaleDateString("id-ID")}</div>
        {time && <div className="text-sm text-muted-foreground">{time}</div>}
      </div>
    </div>
  );
}

// Fallback function jika getAcademicYear tidak tersedia
const fallbackGetAcademicYear = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 7) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

// Gunakan fungsi yang tersedia atau fallback
const academicYearFunction = getAcademicYear || fallbackGetAcademicYear;

// Form ajukan pinjam ruangan
function RoomLoanForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    location: "",
    roomId: "",
    roomName: "",
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "17:00",
    purpose: "",
    facilities: [],
    academicYear: academicYearFunction(),
    semester: getSemesterFromDate(new Date()),
  });
  const [facilitySearch, setFacilitySearch] = useState("");

  const roomLocations = useMemo(() => {
    const rooms = mockAssets.filter((asset) => asset.category === "ruangan");
    return Array.from(new Set(rooms.map((room) => room.location))).sort();
  }, []);

  const availableRooms = useMemo(() => {
    return mockAssets.filter(
      (asset) =>
        asset.category === "ruangan" &&
        (formData.location ? asset.location === formData.location : true)
    );
  }, [formData.location]);

  const availableFacilities = useMemo(() => {
    return mockAssets.filter(
      (asset) =>
        asset.category === "fasilitas" &&
        asset.name.toLowerCase().includes(facilitySearch.toLowerCase())
    );
  }, [facilitySearch]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoomChange = (roomId) => {
    const selectedRoom = availableRooms.find((room) => room.id === roomId);
    setFormData((prev) => ({
      ...prev,
      roomId,
      roomName: selectedRoom?.name ?? "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const addFacility = (facility) => {
    setFormData((prev) => {
      if (prev.facilities.some((item) => item.id === facility.id)) {
        return prev;
      }

      return {
        ...prev,
        facilities: [
          ...prev.facilities,
          { id: facility.id, name: facility.name, quantity: 1 },
        ],
      };
    });
    setFacilitySearch("");
  };

  const removeFacility = (facilityId) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((item) => item.id !== facilityId),
    }));
  };

  const updateFacilityQuantity = (facilityId, quantity) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.map((item) =>
        item.id === facilityId
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Lokasi Gedung</Label>
        <Select
          value={formData.location}
          onValueChange={(value) => {
            handleFieldChange("location", value);
            handleRoomChange("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih lokasi gedung" />
          </SelectTrigger>
          <SelectContent>
            {roomLocations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Ruangan</Label>
        <Select value={formData.roomId} onValueChange={handleRoomChange}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih ruangan" />
          </SelectTrigger>
          <SelectContent>
            {availableRooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name} ({room.location})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Mulai</Label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(event) =>
              handleFieldChange("startDate", event.target.value)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Waktu Mulai</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(event) =>
              handleFieldChange("startTime", event.target.value)
            }
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Selesai</Label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(event) =>
              handleFieldChange("endDate", event.target.value)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Waktu Selesai</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(event) =>
              handleFieldChange("endTime", event.target.value)
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Keperluan Peminjaman</Label>
        <Textarea
          placeholder="Tuliskan keperluan peminjaman ruangan"
          value={formData.purpose}
          onChange={(event) => handleFieldChange("purpose", event.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label>Cari Fasilitas Tambahan</Label>
          <Input
            placeholder="Cari fasilitas..."
            value={facilitySearch}
            onChange={(event) => setFacilitySearch(event.target.value)}
          />
        </div>

        <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
          {availableFacilities.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Fasilitas tidak ditemukan.
            </p>
          )}

          {availableFacilities.map((facility) => (
            <div
              key={facility.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <p className="font-medium">{facility.name}</p>
                <p className="text-sm text-muted-foreground">
                  Lokasi: {facility.location}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => addFacility(facility)}
              >
                Tambahkan
              </Button>
            </div>
          ))}
        </div>

        {formData.facilities.length > 0 && (
          <div className="space-y-2">
            <Label>Fasilitas Terpilih</Label>
            <div className="space-y-2 rounded-md border p-3">
              {formData.facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="flex flex-wrap items-center gap-3 rounded-md bg-muted/40 p-3"
                >
                  <div className="flex-grow">
                    <p className="font-medium">{facility.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Kode: {facility.id}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={facility.quantity}
                    onChange={(event) =>
                      updateFacilityQuantity(facility.id, event.target.value)
                    }
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFacility(facility.id)}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Ajukan</Button>
      </div>
    </form>
  );
}

// Form ajukan pinjam fasilitas
function FacilityLoanForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    startDate: "",
    startTime: "08:00",
    endDate: "",
    endTime: "17:00",
    purpose: "",
    facilities: [],
    academicYear: academicYearFunction(),
    semester: getSemesterFromDate(new Date()),
  });

  const [facilitySearch, setFacilitySearch] = useState("");

  // Ambil hanya fasilitas
  const availableFacilities = useMemo(() => {
    return mockAssets.filter(
      (asset) =>
        asset.category === "fasilitas" &&
        asset.name.toLowerCase().includes(facilitySearch.toLowerCase())
    );
  }, [facilitySearch]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addFacility = (facility) => {
    setFormData((prev) => {
      if (prev.facilities.some((item) => item.id === facility.id)) return prev;

      return {
        ...prev,
        facilities: [
          ...prev.facilities,
          { id: facility.id, name: facility.name, quantity: 1 },
        ],
      };
    });
  };

  const updateFacilityQuantity = (id, quantity) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Number(quantity)) }
          : item
      ),
    }));
  };

  const removeFacility = (id) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((item) => item.id !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Mulai</Label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(event) =>
              handleFieldChange("startDate", event.target.value)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Waktu Mulai</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(event) =>
              handleFieldChange("startTime", event.target.value)
            }
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tanggal Selesai</Label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(event) =>
              handleFieldChange("endDate", event.target.value)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Waktu Selesai</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(event) =>
              handleFieldChange("endTime", event.target.value)
            }
            required
          />
        </div>
      </div>

      <div>
        <Label>Keperluan Peminjaman</Label>
        <Textarea
          rows={3}
          placeholder="Tuliskan keperluan peminjaman fasilitas"
          value={formData.purpose}
          onChange={(e) => handleFieldChange("purpose", e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <Label>Cari Fasilitas</Label>
        <Input
          placeholder="Cari fasilitas..."
          value={facilitySearch}
          onChange={(e) => setFacilitySearch(e.target.value)}
        />

        <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
          {availableFacilities.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Fasilitas tidak ditemukan.
            </p>
          )}

          {availableFacilities.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between border rounded-md px-3 py-2"
            >
              <div>
                <p className="font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  Lokasi: {f.location}
                </p>
              </div>
              <Button variant="ghost" onClick={() => addFacility(f)}>
                Tambahkan
              </Button>
            </div>
          ))}
        </div>

        {formData.facilities.length > 0 && (
          <div className="border rounded-md p-3 space-y-2">
            <Label>Fasilitas Terpilih</Label>

            {formData.facilities.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 bg-muted/40 rounded-md p-3"
              >
                <div className="flex-grow">
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {f.id}</p>
                </div>

                <Input
                  type="number"
                  min={1}
                  value={f.quantity}
                  onChange={(e) => updateFacilityQuantity(f.id, e.target.value)}
                  className="w-20"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFacility(f.id)}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Ajukan</Button>
      </div>
    </form>
  );
}
