import { describe, it, expect } from 'vitest';
import { generatePremiereXml, downloadPremiereXml } from '$lib/utils/premiere-export';
import type { Model } from '$lib/model/model-types';

const sampleModel: Model = {
  project: { name: 'Test Project', fps: 24, resolution: { w: 1920, h: 1080 } },
  assets: {
    characters: [{ id: 'char_01', name: 'Hero', references: [] }],
    environments: {},
    audio: [{ id: 'audio_01', url: 'https://example.com/music.mp3' }]
  },
  timeline: [
    {
      time: 0,
      duration: 24,
      frame: {
        actors: [{ id: 'char_01' }],
        prompt: 'A hero stands',
        audio_tracks: [{ id: 'audio_01' }]
      },
      notes: 'Opening scene'
    },
    {
      time: 1000,
      duration: 48,
      frame: {
        actors: [{ id: 'char_01' }],
        prompt: 'Hero walks forward'
      }
    }
  ],
  config: {},
  markers: [
    {
      id: 'marker_01',
      time: 500,
      type: 'chapter',
      label: 'Chapter 1',
      color: '#ef4444',
      notes: 'First chapter',
      createdAt: 0,
      updatedAt: 0
    }
  ]
};

describe('generatePremiereXml', () => {
  it('generates valid Premiere XML', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<xmeml version="5">');
  });

  it('includes project name', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('Test Project');
  });

  it('includes clips for each event', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<clipitem id=');
  });

  it('includes markers when enabled', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<marker>');
    expect(xml).toContain('Chapter 1');
  });

  it('excludes markers when disabled', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: false
    });
    expect(xml).not.toContain('<marker>');
  });

  it('includes audio tracks when enabled', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('Audio 1');
  });

  it('excludes audio tracks when disabled', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: false,
      includeMarkers: true
    });
    expect(xml).not.toContain('Audio 1');
  });

  it('uses correct resolution for 1080p', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<width>1920</width>');
    expect(xml).toContain('<height>1080</height>');
  });

  it('uses correct resolution for 4K', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '4K',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<width>3840</width>');
    expect(xml).toContain('<height>2160</height>');
  });

  it('escapes XML special characters', () => {
    const modelWithSpecial: Model = {
      ...sampleModel,
      timeline: [
        {
          time: 0,
          duration: 24,
          frame: {
            prompt: 'Test & "quotes" <tags>',
            actors: []
          }
        }
      ]
    };

    const xml = generatePremiereXml(modelWithSpecial, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('Test &amp; &quot;quotes&quot; &lt;tags&gt;');
  });
});

describe('downloadPremiereXml', () => {
  it('generates valid XML for download', () => {
    const xml = generatePremiereXml(sampleModel, {
      frameRate: 24,
      resolution: '1080p',
      includeAudio: true,
      includeMarkers: true
    });
    expect(xml).toContain('<?xml');
    expect(xml.length).toBeGreaterThan(0);
  });
});
