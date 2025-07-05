import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useUserContext } from '@/lib/UserContextProvider';
import { Upload, Save, Edit } from 'lucide-react';
import { apiClient } from '@/lib/api';

export const AccountDetails = () => {
  const { name, email, globalRole, userId, phoneNumber, description, link, hideProfilePicture, setUser } = useUserContext();
  const [formData, setFormData] = useState({
    name: name || '',
    email: email || '',
    phoneNumber:  phoneNumber || '',
    description: description || '',
    link: link || '',
    hideProfilePicture: hideProfilePicture || false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: name || '',
      email: email || '',
      phoneNumber: phoneNumber || '',
      description: description || '',
      link: link || '',
      hideProfilePicture: hideProfilePicture || false,
    });
  }, [name, email, phoneNumber, description, link, hideProfilePicture]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        email: formData.email,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        description: formData.description,
        link: formData.link,
        hideProfilePicture: formData.hideProfilePicture,
        createdAt: "2025-06-12T08:00:00Z",
      };
      setIsLoading(true)

      const response = await apiClient.patch(`/users/${userId}`, payload);

      if (response.status !== 200) {
        throw new Error("Failed to update user data");
      }

      const updatedUserData = response.data;

      // Update UserContextProvider with the latest data
      setUser(updatedUserData);

      console.log("User data updated successfully:", updatedUserData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Details</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt={formData.name} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {getInitials(formData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Avatar
              </Button>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hide-avatar"
                  checked={formData.hideProfilePicture}
                  onCheckedChange={(checked) => handleInputChange('hideProfilePicture', checked)}
                />
                <Label htmlFor="hide-avatar" className="text-sm">Hide Profile Picture</Label>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['name', 'email', 'phoneNumber', 'link', 'description'].map((field) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                {isEditing ? (
                  <Input
                    id={field}
                    value={formData[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={`Enter your ${field}`}
                  />
                ) : (
                  <p className="text-muted-foreground">{formData[field]}</p>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          )}

          {!isEditing && (
            <div className="flex justify-end">
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-[9999]">
          <div className="relative inline-block w-12 h-12">
            <span className="absolute inline-block w-full h-full border-4 border-t-primary border-b-secondary rounded-full animate-spin"></span>
          </div>
        </div>
      )}
    </div>
  );
};
