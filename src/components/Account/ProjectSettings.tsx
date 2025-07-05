import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Palette, 
  Users, 
  Settings,
  Sparkles,
  MessageSquare,
  Zap,
  Shield,
  Sliders,
  Globe
} from 'lucide-react';
import { useUserContext } from '@/lib/UserContextProvider';
import { apiClient } from '@/lib/api';

export const ProjectSettings = () => {
  const { settings, setUser, userId } = useUserContext();

  const defaultSettings = {
    aiSettings: {
      aiEnabled: true,
      features: [
        { id: 'rephrasing', label: 'Rephrasing', enabled: true, prompt: 'Rephrase the following text to be more concise and engaging.', llmModel: 'default' },
        { id: 'expanding', label: 'Expanding', enabled: true, prompt: 'Expand the following text with more details, inner monologue, and sensory imagery.', llmModel: 'default' },
        { id: 'concising', label: 'Concising', enabled: true, prompt: 'Shorten the following text with more details, inner monologue, and sensory imagery.', llmModel: 'default' },
        { id: 'generating', label: 'Generating new lines', enabled: true, prompt: 'Generate new lines based on the context provided.', llmModel: 'default' },
        { id: 'validation', label: 'Validation', enabled: true, prompt: 'Validate the following text for grammar, style, and coherence.', llmModel: 'default' },
        { id: 'planning', label: 'Auto-updating Planning Boards', enabled: true, prompt: 'Update the planning board with the latest context and details.', llmModel: 'default' },
        { id: 'suggestions', label: 'Auto-suggest Next Lines', enabled: true, prompt: 'Suggest the next lines based on the current context.', llmModel: 'default' },
      ],
    },
    theme: {
      color: 'blue',
      customColorHex: '#0000FF',
    },
    collaboration: {
      copyAllowed: true,
      allowComments: true,
      allowSuggestions: true,
      allowTrackChanges: false,
    },
    advanced: {
      temperature: 0.7,
      maxTokens: 1000,
      validationLevel: 'balanced',
      tonePreset: 'conversational',
      maxSentenceLength: 'medium',
      vocabularyComplexity: 'medium',
    },
  };

  const [localSettings, setLocalSettings] = useState(() => ({
    ...defaultSettings,
    ...settings,
  }));

  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) {
      console.log('Settings are empty, saving default settings');
      const saveDefaultSettings = async () => {
        try {
          const payload = {
            settings: defaultSettings,
          };
          const response = await apiClient.patch(`/users/${userId}`, payload);

          if (response.status === 200) {
            setUser({ settings: defaultSettings });
            setLocalSettings(defaultSettings);
            console.log('Default settings saved successfully');
          } else {
            throw new Error('Failed to save default settings');
          }
        } catch (error) {
          console.error('Error saving default settings:', error);
        }
      };

      saveDefaultSettings();
    } else {
      setLocalSettings((prev) => ({
        ...defaultSettings,
        ...settings,
      }));
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      console.log('Saving settings:', localSettings);
      const payload = {
        settings: localSettings,
      };
      const response = await apiClient.patch(`/users/${userId}`, payload);

      if (response.status !== 200) {
        throw new Error('Failed to update settings');
      }

      const updatedSettings = response.data.settings;
      setUser({ settings: updatedSettings });

      console.log('Settings updated successfully:', updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const aiFeatures = [
    { id: 'rephrasing', label: 'Rephrasing', enabled: true, llmModel: 'default', prompt: 'Rephrase the following text to be more concise and engaging.' },
    { id: 'expanding', label: 'Expanding', enabled: true, llmModel: 'default', prompt: 'Expand the following text with more details, inner monologue, and sensory imagery.' },
    { id: 'concising', label: 'Concising', enabled: true, llmModel: 'default', prompt: 'Shorten the following text with more details, inner monologue, and sensory imagery.'},
    { id: 'generating', label: 'Generating new lines', enabled: true, llmModel: 'default', prompt: 'Generate new lines based on the context provided.' },
    { id: 'validation', label: 'Validation', enabled: true, llmModel: 'default', prompt: 'Validate the following text for grammar, style, and coherence.' },
    { id: 'planning', label: 'Auto-updating Planning Boards', enabled: true, llmModel: 'default', prompt: 'Update the planning board with the latest context and details.' },
    { id: 'suggestions', label: 'Auto-suggest Next Lines', enabled: true, llmModel: 'default', prompt: 'Suggest the next lines based on the current context.' },
  ];

  const llmModels = [
    { value: 'default', label: 'Use Default (System Assigned)' },
    { value: 'local-mistral', label: 'Local LLM - Mistral 7B' },
    { value: 'local-llama', label: 'Local LLM - Llama2' },
    { value: 'gpt-4', label: 'Hosted LLM - GPT-4' },
    { value: 'claude-opus', label: 'Hosted LLM - Claude 3 Opus' },
    { value: 'cohere', label: 'Hosted LLM - Cohere' },
  ];

  const tonePresets = [
    'Formal', 'Conversational', 'Lyrical/Poetic', 'Dark/Gritty', 'Epic/Grand', 'Custom'
  ];

  const colorOptions = [
    { name: 'Blue', value: 'blue', bgClass: 'bg-blue-500' },
    { name: 'Purple', value: 'purple', bgClass: 'bg-purple-500' },
    { name: 'Green', value: 'green', bgClass: 'bg-green-500' },
    { name: 'Orange', value: 'orange', bgClass: 'bg-orange-500' },
    { name: 'Red', value: 'red', bgClass: 'bg-red-500' },
    { name: 'Pink', value: 'pink', bgClass: 'bg-pink-500' },
    { name: 'Cyan', value: 'cyan', bgClass: 'bg-cyan-500' },
    { name: 'Yellow', value: 'yellow', bgClass: 'bg-yellow-500' },
  ];

  const handleModelChange = (featureId, model) => {
    setLocalSettings((prev) => ({
      ...prev,
      aiSettings: {
        ...prev.aiSettings,
        features: prev.aiSettings.features.map((f) =>
          f.id === featureId ? { ...f, llmModel: model } : f
        ),
      },
    }));
  };

  const handleFeatureToggle = (featureId, checked) => {
    setLocalSettings((prev) => {
      const updatedFeatures = prev.aiSettings.features.map((feature) =>
        feature.id === featureId ? { ...feature, enabled: checked } : feature
      );

      return {
        ...prev,
        aiSettings: {
          ...prev.aiSettings,
          features: updatedFeatures,
        },
      };
    });
  };

  const handlePromptChange = (featureId, prompt) => {
    setLocalSettings((prev) => {
      const updatedFeatures = prev.aiSettings.features.map((feature) =>
        feature.id === featureId ? { ...feature, prompt } : feature
      );

      return {
        ...prev,
        aiSettings: {
          ...prev.aiSettings,
          features: updatedFeatures,
        },
      };
    });
  };

  const handleToneChange = (tone) => {
    setLocalSettings((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        tonePreset: tone,
      },
    }));
  };

  const handleSentenceLengthChange = (length) => {
    setLocalSettings((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        maxSentenceLength: length,
      },
    }));
  };

  const handleVocabularyComplexityChange = (complexity) => {
    setLocalSettings((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        vocabularyComplexity: complexity,
      },
    }));
  };

  // Safeguard rendering by ensuring localSettings and nested properties are defined
  if (!localSettings || !localSettings.aiSettings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Project Settings
        </h1>
        <p className="text-xl text-muted-foreground">
          Customize your writing environment and AI preferences
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Collaboration
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6 animate-fade-in">
          {/* Global AI Toggle */}
          <Card className="border-primary/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Features Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Enable AI Features</Label>
                  <p className="text-sm text-muted-foreground">Global switch to control all AI functionality</p>
                </div>
                <Switch
                  checked={localSettings.aiSettings?.aiEnabled}
                  onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, aiSettings: { ...prev.aiSettings, aiEnabled: checked } }))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-semibold">Individual Feature Toggles</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{feature.label}</Label>
                        {feature.enabled && <Badge variant="secondary" className="text-xs">Active</Badge>}
                      </div>
                      <Switch 
                        checked={localSettings.aiSettings.features.find((f) => f.id === feature.id)?.enabled && localSettings.aiSettings.aiEnabled} 
                        disabled={!localSettings.aiSettings.aiEnabled} 
                        onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LLM Model Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                LLM Model Selection
              </CardTitle>
              <p className="text-sm text-muted-foreground">Choose specific models for different AI features</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiFeatures.slice(0, 4).map((feature) => (
                <div key={feature.id} className="space-y-2">
                  <Label className="font-medium">{feature.label}</Label>
                  <Select defaultValue="default" onValueChange={(value) => handleModelChange(feature.id, value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {llmModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Custom Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                Custom AI Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="font-semibold">Global Custom Instructions</Label>
                <Textarea 
                  placeholder="e.g., 'Always use concise sentences with strong verbs.'"
                  className="min-h-[80px]"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="font-semibold">Feature-Specific Instructions</Label>
                <div className="space-y-4">
                  {localSettings?.aiSettings?.features?.map((feature) => (
                    <div key={feature.id} className="space-y-2">
                      <Label className="text-sm font-medium">{feature.label}</Label>
                      <Textarea 
                        value={feature.prompt}
                        onChange={(e) => handlePromptChange(feature.id, e.target.value)}
                        placeholder={`e.g., '${feature.prompt}'`}
                        className="min-h-[60px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tone & Style */}
          <Card>
            <CardHeader>
              <CardTitle>Tone & Style Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tone Preset</Label>
                <Select
                  value={localSettings.advanced.tonePreset}
                  onValueChange={(value) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      advanced: {
                        ...prev.advanced,
                        tonePreset: value,
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tonePresets.map((tone) => (
                      <SelectItem key={tone} value={tone.toLowerCase()}>
                        {tone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Sentence Length</Label>
                  <Select
                    value={localSettings.advanced.maxSentenceLength}
                    onValueChange={(value) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        advanced: {
                          ...prev.advanced,
                          maxSentenceLength: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (&lt; 15 words)</SelectItem>
                      <SelectItem value="medium">Medium (&lt; 20 words)</SelectItem>
                      <SelectItem value="long">Long (&lt; 30 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vocabulary Complexity</Label>
                  <Select
                    value={localSettings.advanced.vocabularyComplexity}
                    onValueChange={(value) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        advanced: {
                          ...prev.advanced,
                          vocabularyComplexity: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6 animate-fade-in">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-500" />
                Theme Color Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">Customize your visual experience</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {colorOptions.map((color) => (
                  <div key={color.value} className="text-center space-y-2">
                    <div className={`w-12 h-12 rounded-full mx-auto cursor-pointer transition-transform hover:scale-110 ${color.bgClass}`} />
                    <Label className="text-sm">{color.name}</Label>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Custom Color Hex</Label>
                <Input type="color" className="w-20 h-10" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6 animate-fade-in">
          <Card className="border-green-200 bg-gradient-to-r from-green-50/50 to-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Collaboration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Allow Copy</Label>
                  <p className="text-sm text-muted-foreground">Enable others to copy content from your shared documents</p>
                </div>
                <Switch 
                  checked={localSettings.collaboration.copyAllowed} 
                  onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, collaboration: { ...prev.collaboration, copyAllowed: checked } }))} 
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-semibold">Permission Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Allow Comments</Label>
                    <Switch 
                      checked={localSettings.collaboration.allowComments} 
                      onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, collaboration: { ...prev.collaboration, allowComments: checked } }))} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Suggestions</Label>
                    <Switch 
                      checked={localSettings.collaboration.allowSuggestions} 
                      onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, collaboration: { ...prev.collaboration, allowSuggestions: checked } }))} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Track Changes</Label>
                    <Switch 
                      checked={localSettings.collaboration.allowTrackChanges} 
                      onCheckedChange={(checked) => setLocalSettings((prev) => ({ ...prev, collaboration: { ...prev.collaboration, allowTrackChanges: checked } }))} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 animate-fade-in">
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50/50 to-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-orange-500" />
                Advanced AI Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">Fine-tune AI behavior for expert users</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Temperature / Creativity: {localSettings.advanced.temperature}</Label>
                  <Slider
                    value={[localSettings.advanced.temperature]}
                    onValueChange={(value) => setLocalSettings((prev) => ({ ...prev, advanced: { ...prev.advanced, temperature: value[0] } }))}
                    max={1.5}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Higher values make output more random and creative</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Max Tokens: {localSettings.advanced.maxTokens}</Label>
                  <Slider
                    value={[localSettings.advanced.maxTokens]}
                    onValueChange={(value) => setLocalSettings((prev) => ({ ...prev, advanced: { ...prev.advanced, maxTokens: value[0] } }))}
                    max={2000}
                    min={100}
                    step={50}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Limit response length to prevent unbounded outputs</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="font-semibold">Privacy & Data Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Default to Local LLM</Label>
                      <p className="text-xs text-muted-foreground">Prioritize local models for privacy</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Hosted LLM Usage</Label>
                      <p className="text-xs text-muted-foreground">Consent to use cloud-based models</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Save AI Suggestions</Label>
                      <p className="text-xs text-muted-foreground">Store outputs for reuse and recovery</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Validation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Validation Strictness Level</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strict">Strict - Flag all unfulfilled goals</SelectItem>
                    <SelectItem value="balanced">Balanced - Only flag major missing goals</SelectItem>
                    <SelectItem value="relaxed">Relaxed - Provide suggestions without flagging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-update Planning Boards</Label>
                  <p className="text-sm text-muted-foreground">Automatically update boards after edits</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6">
        <Button variant="outline">Reset to Defaults</Button>
        <Button className="bg-gradient-to-r from-primary to-purple-600 text-white" onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};
