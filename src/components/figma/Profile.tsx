import * as React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
// Badge removed from profile header; keep import removed to avoid unused symbol
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Github, Linkedin, Instagram, Facebook, MapPin } from "lucide-react"
import { getProfile, updateProfile } from "@/services/profile"
import type { Profile as ProfileType } from "@/services/profile"
import { useAuth } from "./AuthContext"

type ExtendedProfile = ProfileType & {
  city?: string
  website?: string
  phone?: string
  skills?: string[]
  linkedin?: string
  github?: string
  instagram?: string
  facebook?: string
  via?: string
  cap?: string
}

type AuthSetter = (updater: (u: unknown) => unknown) => void

export function Profile() {
  const { setUser } = useAuth() as { setUser?: AuthSetter }
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    city: "",
    profession: "",
    bio: "",
    website: "",
    phone: "",
    address: "",
    via: "",
    cap: "",
    linkedin: "",
    github: "",
    instagram: "",
    facebook: "",
    skills: "",
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const p = await getProfile()
      if (!mounted) return
      setProfile(p)
      if (p) {
        setForm({
          username: p.username || "",
          email: p.email || "",
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          city: (p as ExtendedProfile).city || "",
          profession: p.profession || "",
          bio: p.bio || "",
          website: (p as ExtendedProfile).website || "",
          phone: (p as ExtendedProfile).phone || "",
          address: p.address || "",
          via: (p as ExtendedProfile).via || "",
          cap: (p as ExtendedProfile).cap || "",
          linkedin: (p as ExtendedProfile).linkedin || "",
          github: (p as ExtendedProfile).github || "",
          instagram: (p as ExtendedProfile).instagram || "",
          facebook: (p as ExtendedProfile).facebook || "",
          skills: ((p as ExtendedProfile).skills || []).join(", ")
        })
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.username || form.username.trim().length < 1) e.username = "Username è obbligatorio"
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Email valida è obbligatoria"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    const fd = new FormData()
    fd.append("username", form.username)
    fd.append("email", form.email)
    fd.append("first_name", form.first_name)
    fd.append("last_name", form.last_name)
    fd.append("bio", form.bio)
    fd.append("profession", form.profession)
    fd.append("website", form.website)
    fd.append("phone", form.phone)
    fd.append("address", form.address)
    fd.append("city", form.city)
  fd.append("via", form.via)
  fd.append("cap", form.cap)
  fd.append("linkedin", form.linkedin)
  fd.append("github", form.github)
  fd.append("instagram", form.instagram)
  fd.append("facebook", form.facebook)
    // skills as comma-separated
    fd.append("skills", form.skills)

    setLoading(true)
    const updated = await updateProfile(fd)
    setLoading(false)
    if (updated) {
      setProfile(updated)
      // refresh auth context user if available
  if (setUser) setUser((u) => ({ ...(u as Record<string, unknown>), name: updated.username, email: updated.email }))
      setIsEditing(false)
    }
  }

  function handleCancel() {
    if (profile) {
      setForm({
        username: profile.username || "",
        email: profile.email || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        city: (profile as ExtendedProfile).city || "",
        profession: profile.profession || "",
        bio: profile.bio || "",
        website: (profile as ExtendedProfile).website || "",
        phone: (profile as ExtendedProfile).phone || "",
        address: profile.address || "",
        via: (profile as ExtendedProfile).via || "",
        cap: (profile as ExtendedProfile).cap || "",
        linkedin: (profile as ExtendedProfile).linkedin || "",
        github: (profile as ExtendedProfile).github || "",
        instagram: (profile as ExtendedProfile).instagram || "",
        facebook: (profile as ExtendedProfile).facebook || "",
        skills: ((profile as ExtendedProfile).skills || []).join(", ")
      })
    }
    setIsEditing(false)
    setErrors({})
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Profile</h1>
          <p className="text-muted-foreground">Aggiorna le tue informazioni personali</p>
        </div>
        <div>
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={handleCancel} className="mr-2">Annulla</Button>
              <Button onClick={handleSave}>Salva</Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Modifica</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center md:items-start">
              <Avatar className="size-24 mb-4">
                {profile?.avatar ? (
                  <AvatarImage src={profile.avatar as string} alt={profile.username} />
                ) : (
                  <AvatarFallback className="text-xl">{(profile?.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              {/* role badge removed per design: hide 'student' badge */}
              <div className="mt-3 flex gap-3">
                {(profile as ExtendedProfile)?.github && (
                  <a href={(profile as ExtendedProfile).github} target="_blank" rel="noreferrer" aria-label="GitHub">
                    <Github className="size-5" />
                  </a>
                )}
                {(profile as ExtendedProfile)?.linkedin && (
                  <a href={(profile as ExtendedProfile).linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <Linkedin className="size-5" />
                  </a>
                )}
                {(profile as ExtendedProfile)?.instagram && (
                  <a href={(profile as ExtendedProfile).instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Instagram className="size-5" />
                  </a>
                )}
                {(profile as ExtendedProfile)?.facebook && (
                  <a href={(profile as ExtendedProfile).facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                    <Facebook className="size-5" />
                  </a>
                )}
                {(profile as ExtendedProfile)?.via && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" />{(profile as ExtendedProfile).via}{(profile as ExtendedProfile).cap ? `, ${ (profile as ExtendedProfile).cap}` : ''}</div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                {/* Row: Username / Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="mb-1 block">Username *</Label>
                    <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                    {errors.username && <p className="text-red-600 text-sm">{errors.username}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="mb-1 block">Email *</Label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
                  </div>
                </div>

                {/* Row: Nome / Cognome */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <Label className="mb-1 block">Nome</Label>
                    <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="mb-1 block">Cognome</Label>
                    <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-4 space-y-1">
                  <Label className="mb-1 block">Bio</Label>
                  <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </div>

                {/* Professione */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <Label className="mb-1 block">Professione</Label>
                    <Input value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="mb-1 block">Skills (separate con virgola)</Label>
                    <Input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                  </div>
                </div>

                {/* Città / CAP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <Label className="mb-1 block">Città</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="mb-1 block">CAP</Label>
                    <Input value={form.cap} onChange={(e) => setForm({ ...form, cap: e.target.value })} />
                  </div>
                </div>

                {/* Via */}
                <div className="mt-4 space-y-1">
                  <Label className="mb-1 block">Via</Label>
                  <Input value={form.via} onChange={(e) => setForm({ ...form, via: e.target.value })} />
                </div>

                {/* Telefono / Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <Label className="mb-1 block">Telefono</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="mb-1 block">Website</Label>
                    <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                  </div>
                </div>

                {/* Social: LinkedIn, GitHub, Instagram, Facebook */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <Label className="mb-1 block">LinkedIn</Label>
                    <div className="flex items-center gap-2">
                      <Linkedin className="size-5 text-muted-foreground" />
                      <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="mb-1 block">GitHub</Label>
                    <div className="flex items-center gap-2">
                      <Github className="size-5 text-muted-foreground" />
                      <Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <Label className="mb-1 block">Instagram</Label>
                    <div className="flex items-center gap-2">
                      <Instagram className="size-5 text-muted-foreground" />
                      <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="mb-1 block">Facebook</Label>
                    <div className="flex items-center gap-2">
                      <Facebook className="size-5 text-muted-foreground" />
                      <Input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}