import React from "react";
import {useNavigate} from "react-router";
import {motion} from "motion/react";
import {toast} from "sonner";
import {Container} from "~/components/ui/container";
import {Button} from "~/components/ui/button";
import {Card} from "~/components/ui/card";
import {Input} from "~/components/ui/input";
import {Label} from "~/components/ui/label";
// Badge available from ~/components/ui/badge if needed
import {ArrowLeft, CheckCircle2, ExternalLink, MessageCircle, Users, BookOpen} from "lucide-react";
import type {Route} from "./+types/suggest";
import {config} from "~/lib/config";

export function meta(_args: Route.MetaArgs) {
  return [
    {title: "Suggest a Community - WGU Extension"},
    {
      name: "description",
      content: "Suggest a Discord server, Reddit community, " +
        "or study group for WGU students",
    },
  ];
}

interface CommunityFormData {
  communityType: "discord" | "reddit" | "student_group" | "wgu_connect" | "";
  name: string;
  url: string;
  description: string;
  courseCode: string;
  college: string;
  memberCount: string;
  tags: string;
  submitterName: string;
  submitterEmail: string;
  submitterRole: "student" | "faculty" | "alumni" | "";

  // Discord specific
  inviteCode: string;

  // Reddit specific
  subredditName: string;

  // WGU Connect specific
  groupId: string;
}

export default function SuggestCommunity() {
  const navigate = useNavigate();

  const [formData, setFormData] = React.useState<CommunityFormData>({
    communityType: "",
    name: "",
    url: "",
    description: "",
    courseCode: "",
    college: "",
    memberCount: "",
    tags: "",
    submitterName: "",
    submitterEmail: "",
    submitterRole: "",
    inviteCode: "",
    subredditName: "",
    groupId: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [suggestionId, setSuggestionId] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.communityType || !formData.name || !formData.url || !formData.description) {
        throw new Error("Please fill in all required fields");
      }

      // Build the suggestion payload
      const suggestion = {
        type: "community_suggestion",
        communityType: formData.communityType,
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim(),
        courseCode: formData.courseCode.trim() || undefined,
        college: formData.college.trim() || undefined,
        memberCount: formData.memberCount ? parseInt(formData.memberCount) : undefined,
        tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : undefined,
        submitterName: formData.submitterName.trim() || undefined,
        submitterEmail: formData.submitterEmail.trim() || undefined,
        submitterRole: formData.submitterRole || undefined,
        inviteCode: formData.inviteCode.trim() || undefined,
        subredditName: formData.subredditName.trim() || undefined,
        groupId: formData.groupId.trim() || undefined,
        collectedAt: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(suggestion).forEach((key) => {
        if (suggestion[key as keyof typeof suggestion] === undefined) {
          delete suggestion[key as keyof typeof suggestion];
        }
      });

      const functionsUrl = config.isDev ?
        `http://localhost:5001/${config.firebase.projectId}/us-central1` :
        config.api.baseUrl;

      const response = await fetch(`${functionsUrl}/suggestCommunity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(suggestion),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new Error("This community has already been suggested.");
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setSuggestionId(result.suggestionId);
      setSuccess(true);

      // Show success toast in development
      if (import.meta.env.DEV) {
        toast.success("Suggestion Submitted!", {
          description: "Your community suggestion has been submitted for review.",
          duration: 7000,
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to submit suggestion";
      setError(errorMessage);

      // Show error toast in development
      if (import.meta.env.DEV) {
        toast.error("Submission Failed", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => {
              setError("");
              setLoading(false);
            },
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const communityTypes = [
    {
      value: "discord",
      label: "Discord Server",
      icon: MessageCircle,
      description: "A Discord server for WGU students",
    },
    {
      value: "reddit",
      label: "Reddit Community",
      icon: Users,
      description: "A subreddit related to WGU or specific courses",
    },
    {
      value: "student_group",
      label: "Student Group",
      icon: BookOpen,
      description: "Study groups, clubs, or other student organizations",
    },
    {
      value: "wgu_connect",
      label: "WGU Connect Group",
      icon: ExternalLink,
      description: "Official WGU Connect study groups",
    },
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Container className="py-16">
          <motion.div
            initial={{scale: 0.95, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{duration: 0.4}}
            className="max-w-lg mx-auto text-center"
          >
            <Card className="p-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">Suggestion Submitted!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you for your suggestion! Our team will review it
                and add it to our community resources if approved.
              </p>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Suggestion ID: <span className="font-mono">{suggestionId}</span>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate("/")} variant="default">
                    Go Home
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Submit Another
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{y: -20, opacity: 0}}
        animate={{y: 0, opacity: 1}}
        transition={{duration: 0.4}}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Container className="py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Suggest a Community</h1>
              <p className="text-sm text-muted-foreground">
                Help us grow our collection of WGU community resources
              </p>
            </div>
          </div>
        </Container>
      </motion.header>

      <main className="py-8">
        <Container size="lg">
          <motion.div
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.1, duration: 0.4}}
          >
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Community Type Selection */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Community Type *</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      What type of community are you suggesting?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {communityTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.communityType === type.value ?
                            "border-primary bg-primary/5" :
                            "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setFormData((prev) => ({...prev, communityType: type.value as any}))}
                      >
                        <div className="flex items-start gap-3">
                          <type.icon className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Basic Information</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Community Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="Enter the community name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="url">URL *</Label>
                      <Input
                        id="url"
                        name="url"
                        type="url"
                        required
                        placeholder="https://..."
                        value={formData.url}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      name="description"
                      required
                      rows={3}
                      placeholder="Describe this community and what makes it valuable for WGU students..."
                      value={formData.description}
                      onChange={handleChange}
                      disabled={loading}
                      className={
                        "w-full px-3 py-2 border border-input rounded-md " +
                        "text-sm resize-none focus:outline-none " +
                        "focus:ring-2 focus:ring-ring focus:border-transparent"
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      10-500 characters. Be specific about what students can find here.
                    </p>
                  </div>
                </div>

                {/* Optional Details */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Additional Details (Optional)</Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseCode">Course Code</Label>
                      <Input
                        id="courseCode"
                        name="courseCode"
                        placeholder="e.g., C123, D456A"
                        value={formData.courseCode}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        If specific to a course
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="college">College</Label>
                      <Input
                        id="college"
                        name="college"
                        placeholder="e.g., College of IT"
                        value={formData.college}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="memberCount">Approximate Member Count</Label>
                      <Input
                        id="memberCount"
                        name="memberCount"
                        type="number"
                        min="1"
                        placeholder="e.g., 150"
                        value={formData.memberCount}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        name="tags"
                        placeholder="study group, networking, support"
                        value={formData.tags}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated, max 10 tags
                      </p>
                    </div>
                  </div>
                </div>

                {/* Type-specific fields */}
                {formData.communityType === "discord" && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Discord Details</Label>
                    <div className="space-y-2">
                      <Label htmlFor="inviteCode">Invite Code</Label>
                      <Input
                        id="inviteCode"
                        name="inviteCode"
                        placeholder="e.g., abc123 (from discord.gg/abc123)"
                        value={formData.inviteCode}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {formData.communityType === "reddit" && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Reddit Details</Label>
                    <div className="space-y-2">
                      <Label htmlFor="subredditName">Subreddit Name</Label>
                      <Input
                        id="subredditName"
                        name="subredditName"
                        placeholder="e.g., WGU (without r/)"
                        value={formData.subredditName}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {formData.communityType === "wgu_connect" && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">WGU Connect Details</Label>
                    <div className="space-y-2">
                      <Label htmlFor="groupId">Group ID</Label>
                      <Input
                        id="groupId"
                        name="groupId"
                        placeholder="From the URL or group settings"
                        value={formData.groupId}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Your Information (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Help us verify the suggestion and follow up if needed
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="submitterName">Your Name</Label>
                      <Input
                        id="submitterName"
                        name="submitterName"
                        placeholder="Your name (optional)"
                        value={formData.submitterName}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submitterEmail">Your Email</Label>
                      <Input
                        id="submitterEmail"
                        name="submitterEmail"
                        type="email"
                        placeholder="your@email.com (optional)"
                        value={formData.submitterEmail}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="submitterRole">Your Role</Label>
                    <select
                      id="submitterRole"
                      name="submitterRole"
                      value={formData.submitterRole}
                      onChange={handleChange}
                      disabled={loading}
                      className={
                        "w-full px-3 py-2 border border-input rounded-md " +
                        "text-sm focus:outline-none focus:ring-2 " +
                        "focus:ring-ring focus:border-transparent"
                      }
                    >
                      <option value="">Select your role (optional)</option>
                      <option value="student">Current Student</option>
                      <option value="alumni">Alumni</option>
                      <option value="faculty">Faculty/Staff</option>
                    </select>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <motion.div
                    initial={{opacity: 0, y: -10}}
                    animate={{opacity: 1, y: 0}}
                    className="p-4 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <p className="text-destructive text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <div className="pt-6 border-t">
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/")}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        loading ||
                        !formData.communityType ||
                        !formData.name ||
                        !formData.url ||
                        !formData.description
                      }
                    >
                      {loading ? (
                        <>
                          <div
                            className={
                              "h-4 w-4 animate-spin rounded-full " +
                              "border-2 border-current border-t-transparent mr-2"
                            }
                          />
                          Submitting...
                        </>
                      ) : (
                        "Submit Suggestion"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    By submitting, you confirm that this community is
                    appropriate for WGU students and doesn&apos;t contain
                    personal information.
                  </p>
                </div>
              </form>
            </Card>
          </motion.div>
        </Container>
      </main>
    </div>
  );
}
