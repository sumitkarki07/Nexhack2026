'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  FileText,
  Trash2,
  Search,
  Bookmark,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  StickyNote,
  Shield,
} from 'lucide-react';
import { BriefCard } from '@/components/research';
import { Button, Card, Input, Modal, Badge, Tabs } from '@/components/ui';
import { useStrategy } from '@/context';
import { useSavedResearch, SavedResearch } from '@/hooks';
import { formatRelativeDate, formatPrice } from '@/lib/formatters';

type TabValue = 'saved' | 'drafts';

// Saved research card component
function SavedResearchCard({
  research,
  onDelete,
  onAddNote,
}: {
  research: SavedResearch;
  onDelete: () => void;
  onAddNote: () => void;
}) {
  const riskColors = {
    low: 'text-bullish bg-bullish/10',
    medium: 'text-warning bg-warning/10',
    high: 'text-bearish bg-bearish/10',
  };

  const verificationColors = {
    verified: 'text-bullish bg-bullish/10',
    partially_verified: 'text-warning bg-warning/10',
    unverified: 'text-bearish bg-bearish/10',
  };

  const verificationLabels = {
    verified: 'Verified',
    partially_verified: 'Partial',
    unverified: 'Unverified',
  };

  return (
    <Card padding="md" className="hover:border-bullish/50 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Badge variant="secondary" className="text-xs">
          {research.marketCategory}
        </Badge>
        <div className="flex items-center gap-1">
          <Badge
            variant="secondary"
            className={`text-xs ${verificationColors[research.verificationStatus]}`}
          >
            <Shield size={10} className="mr-1" />
            {verificationLabels[research.verificationStatus]}
          </Badge>
        </div>
      </div>

      {/* Question */}
      <Link href={`/market/${encodeURIComponent(research.marketId)}`}>
        <h3 className="font-semibold text-text-primary mb-3 line-clamp-2 hover:text-bullish transition-colors cursor-pointer">
          {research.marketQuestion}
        </h3>
      </Link>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-surface-elevated rounded-lg p-2">
          <div className="flex items-center gap-1 text-bullish text-xs mb-1">
            <TrendingUp size={12} />
            YES
          </div>
          <p className="text-lg font-bold text-text-primary">
            {formatPrice(research.yesPrice)}
          </p>
        </div>
        <div className="bg-surface-elevated rounded-lg p-2">
          <div className="flex items-center gap-1 text-bearish text-xs mb-1">
            <TrendingDown size={12} />
            NO
          </div>
          <p className="text-lg font-bold text-text-primary">
            {formatPrice(research.noPrice)}
          </p>
        </div>
      </div>

      {/* Risk & Confidence */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className={`${riskColors[research.riskLevel]} text-xs`}>
          <AlertTriangle size={10} className="mr-1" />
          {research.riskLevel.toUpperCase()} Risk
        </Badge>
        <Badge variant="secondary" className="text-xs">
          <CheckCircle2 size={10} className="mr-1" />
          {Math.round(research.confidence)}% Confidence
        </Badge>
      </div>

      {/* Summary */}
      <p className="text-sm text-text-secondary line-clamp-2 mb-3">
        {research.summary}
      </p>

      {/* Notes */}
      {research.notes && (
        <div className="bg-surface-elevated rounded-lg p-2 mb-3">
          <div className="flex items-center gap-1 text-xs text-text-secondary mb-1">
            <StickyNote size={10} />
            Your Notes
          </div>
          <p className="text-sm text-text-primary">{research.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-text-secondary">
          <Calendar size={12} />
          Saved {formatRelativeDate(research.savedAt)}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNote}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <StickyNote size={12} className="mr-1" />
            Note
          </Button>
          <Link href={`/market/${encodeURIComponent(research.marketId)}`}>
            <Button variant="secondary" size="sm">
              <ArrowUpRight size={12} className="mr-1" />
              View
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-bearish hover:bg-bearish/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function ResearchPage() {
  const { drafts, deleteDraft } = useStrategy();
  const { savedResearch, removeResearch, updateNotes, clearAll, isLoaded } = useSavedResearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'draft' | 'saved'>('draft');
  const [activeTab, setActiveTab] = useState<TabValue>('saved');
  const [noteModal, setNoteModal] = useState<{ id: string; currentNote: string } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);

  // Filter drafts by search query
  const filteredDrafts = drafts.filter(
    (draft) =>
      draft.marketQuestion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.sedaPost?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter saved research by search query
  const filteredSaved = savedResearch.filter(
    (r) =>
      r.marketQuestion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.marketCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    if (deleteType === 'draft') {
      deleteDraft(deleteConfirmId);
    } else {
      removeResearch(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  const handleSaveNote = () => {
    if (noteModal) {
      updateNotes(noteModal.id, noteText);
      setNoteModal(null);
      setNoteText('');
    }
  };

  const tabs = [
    {
      value: 'saved' as const,
      label: `Saved Research (${savedResearch.length})`,
      icon: <Bookmark size={16} />,
    },
    {
      value: 'drafts' as const,
      label: `Seda Drafts (${drafts.length})`,
      icon: <FileText size={16} />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={28} className="text-bullish" />
          <h1 className="text-3xl font-bold text-text-primary">Research Hub</h1>
        </div>
        <p className="text-text-secondary">
          Your saved market research and Seda drafts. Stay informed and make better decisions.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          value={activeTab}
          onChange={(v) => setActiveTab(v as TabValue)}
        />
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'saved' ? 'Search saved research...' : 'Search drafts...'}
            leftIcon={<Search size={18} />}
          />
        </div>
        {activeTab === 'saved' && savedResearch.length > 0 && (
          <Button
            variant="ghost"
            onClick={() => setClearConfirm(true)}
            className="text-bearish hover:bg-bearish/10"
          >
            <Trash2 size={14} className="mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'saved' ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {!isLoaded ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bullish" />
              </div>
            ) : filteredSaved.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredSaved.map((research, index) => (
                  <motion.div
                    key={research.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <SavedResearchCard
                      research={research}
                      onDelete={() => {
                        setDeleteType('saved');
                        setDeleteConfirmId(research.id);
                      }}
                      onAddNote={() => {
                        setNoteModal({ id: research.id, currentNote: research.notes || '' });
                        setNoteText(research.notes || '');
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card padding="lg" className="text-center">
                <Bookmark size={48} className="mx-auto text-text-secondary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {searchQuery ? 'No matching research' : 'No saved research yet'}
                </h3>
                <p className="text-text-secondary mb-4">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Click the "Research" button on any market card to analyze and save research.'}
                </p>
                {!searchQuery && (
                  <Link href="/">
                    <Button variant="primary">
                      <Search size={14} className="mr-2" />
                      Explore Markets
                    </Button>
                  </Link>
                )}
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="drafts"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {filteredDrafts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDrafts.map((draft, index) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BriefCard
                      draft={draft}
                      onDelete={(id) => {
                        setDeleteType('draft');
                        setDeleteConfirmId(id);
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card padding="lg" className="text-center">
                <FileText size={48} className="mx-auto text-text-secondary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {searchQuery ? 'No matching drafts' : 'No Seda drafts saved yet'}
                </h3>
                <p className="text-text-secondary mb-4">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Generate AI briefs and compose Seda posts from market pages to see them here.'}
                </p>
                {!searchQuery && (
                  <Link href="/">
                    <Button variant="primary">Explore Markets</Button>
                  </Link>
                )}
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12"
      >
        <Card padding="md" className="bg-bullish/5 border-bullish/20">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            💡 Research Tips
          </h3>
          <ul className="text-sm text-text-secondary space-y-1">
            {activeTab === 'saved' ? (
              <>
                <li>• Save markets you&apos;re interested in to track them over time</li>
                <li>• Add personal notes to remind yourself of key insights</li>
                <li>• Check verification status - verified data is more reliable</li>
                <li>• Re-research markets before placing bets to get updated info</li>
              </>
            ) : (
              <>
                <li>• Include specific evidence and data points to spark quality debates</li>
                <li>• Frame your thesis clearly but acknowledge uncertainty</li>
                <li>• Use debate prompts that invite diverse perspectives</li>
                <li>
                  • Don&apos;t forget the <span className="font-mono text-bullish">#nexhacks</span> tag!
                </li>
              </>
            )}
          </ul>
        </Card>
      </motion.div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title={deleteType === 'draft' ? 'Delete Draft?' : 'Remove Saved Research?'}
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          {deleteType === 'draft'
            ? 'Are you sure you want to delete this draft? This action cannot be undone.'
            : 'Are you sure you want to remove this saved research? You can always save it again later.'}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDelete}
            className="flex-1 bg-bearish hover:bg-bearish-hover"
          >
            <Trash2 size={14} className="mr-2" />
            {deleteType === 'draft' ? 'Delete' : 'Remove'}
          </Button>
        </div>
      </Modal>

      {/* Clear all confirmation modal */}
      <Modal
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        title="Clear All Saved Research?"
        size="sm"
      >
        <p className="text-text-secondary mb-6">
          This will remove all {savedResearch.length} saved research items. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setClearConfirm(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              clearAll();
              setClearConfirm(false);
            }}
            className="flex-1 bg-bearish hover:bg-bearish-hover"
          >
            <Trash2 size={14} className="mr-2" />
            Clear All
          </Button>
        </div>
      </Modal>

      {/* Note edit modal */}
      <Modal
        isOpen={!!noteModal}
        onClose={() => {
          setNoteModal(null);
          setNoteText('');
        }}
        title="Add Note"
        size="sm"
      >
        <div className="mb-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add your thoughts, reminders, or analysis notes..."
            className="w-full h-32 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-bullish/50 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setNoteModal(null);
              setNoteText('');
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveNote} className="flex-1">
            <StickyNote size={14} className="mr-2" />
            Save Note
          </Button>
        </div>
      </Modal>
    </div>
  );
}
