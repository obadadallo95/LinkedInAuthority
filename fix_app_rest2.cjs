const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const goodRestCode = `  // Append tags to the active post draft
  const handleAppendHashtags = async (tags: string[]) => {
    if (!activePostId) return;
    const currentPost = posts.find(p => p.id === activePostId);
    if (!currentPost) return;
    const tagsStr = "\\n\\n" + tags.join(" ");
    const newText = currentPost.text + tagsStr;
    await handleUpdatePostText(newText);
    showToast(lang === 'ar' ? "تمت إضافة الهاشتاغات المقترحة للبوست الحالي ✓" : "Hashtags appended to active post ✓");
  };

  // Append tags to all available drafts helper
  const handleAppendToAllDrafts = async (tags: string[]) => {
    const drafts = posts.filter(p => p.status === 'draft' || p.status === 'failed');
    if (drafts.length === 0) return;
    const tagsStr = "\\n\\n" + tags.join(" ");
    try {
      for (const d of drafts) {
        const postRef = doc(db, "users", user.uid, "posts", d.id);
        const newText = d.text + tagsStr;
        await updateDoc(postRef, { text: newText });
      }
      showToast(lang === 'ar' ? "تمت إضافة الهاشتاغات المقترحة لجميع المسودات ✓" : "Hashtags appended to all drafts ✓");
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? "حدث خطأ" : "Error appending tags");
    }
  };

  // Instant direct broadcast publishing to LinkedIn
  const handlePublishNow = async () => {
    if (!activePostId) return;
    const currentPost = posts.find(p => p.id === activePostId);
    if (!currentPost) return;
    try {
      const res = await fetch("/api/publish-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.linkedinToken,
          text: currentPost.text,
          repo: currentPost.repoName,
        })
      });
      if (res.ok) {
        const postRef = doc(db, "users", user.uid, "posts", activePostId);
        await updateDoc(postRef, {
          status: 'published',
          publishTime: new Date().toISOString(),
        });
        showToast(lang === 'ar' ? "تم نشر منشورك الذكي على لينكد إن بنجاح! 🚀" : "Published successfully to LinkedIn! 🚀");
      } else {
        const err = await res.json();
        throw new Error(err.error || "LinkedIn publishing parameters rejected");
      }
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? "فشل النشر" : "Failed to publish");
    }
  };

  // Schedule release publishing for a future date/time
  const handleSchedulePost = async (timeVal: string) => {
    if (!activePostId || !timeVal) {
      showToast(t[lang].toastScheduleRequired);
      return;
    }
    const currentPost = posts.find(p => p.id === activePostId);
    if (!currentPost) return;
    try {
      const postRef = doc(db, "users", user.uid, "posts", activePostId);
      await updateDoc(postRef, {
        status: 'scheduled',
        scheduledAt: new Date(timeVal).toISOString(),
      });
      showToast(lang === 'ar' ? "تمت جدولة المنشور بنجاح! ⏰" : "Post scheduled successfully! ⏰");
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? "فشل الجدولة" : "Failed to schedule");
    }
  };

  // Cancel scheduling, reverting post back to draft
  const handleCancelSchedule = async () => {
    if (!activePostId) return;
    try {
      const postRef = doc(db, "users", user.uid, "posts", activePostId);
      await updateDoc(postRef, {
        status: 'draft',
        scheduledAt: null,
        publishTime: null,
      });
      showToast(lang === 'ar' ? "تم إلغاء الجدولة وإعادة المنشور للمسودات بنجاح" : "Schedule canceled, post reverted to drafts");
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? "فشل الإلغاء" : "Failed to cancel schedule");
    }
  };

  // Delete/Discard draft completely
  const handleDeletePost = async (specificId?: string) => {
    const targetId = specificId || activePostId;
    if (!targetId) return;
    try {
      const postRef = doc(db, "users", user.uid, "posts", targetId);
      await deleteDoc(postRef);
      if (activePostId === targetId) {
        setActivePostId(null);
      }
      showToast(lang === 'ar' ? "تم الحذف بنجاح ✓" : "Deleted successfully ✓");
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? "فشل الحذف" : "Failed to delete");
    }
  };

  const handleSaveAsTemplate = async (post: any) => {
    if (!post) return;
    try {
      const postsRef = collection(db, "users", user.uid, "posts");
      await addDoc(postsRef, {
        repoName: post.repoName || "Template",
        text: post.text,
        status: 'template',
        createdAt: new Date().toISOString(),
        cardConfig: post.cardConfig || {
          title: "New Template",
          subtitle: "Template Subtitle",
          tech: "React, TypeScript",
          theme: "dark"
        }
      });
      showToast(lang === 'ar' ? 'تم حفظ القالب بنجاح' : 'Template saved successfully');
    } catch (e) {
      console.error(e);
      showToast(lang === 'ar' ? 'فشل الحفظ' : 'Failed to save template');
    }
  };

  const handleUseTemplate = async (template: any) => {
    try {
      const postsRef = collection(db, "users", user.uid, "posts");
      await addDoc(postsRef, {
        repoName: "Template Draft",
        text: template.text,
        status: 'draft',
        createdAt: new Date().toISOString(),
        cardConfig: template.cardConfig || {}
      });
      showToast(lang === 'ar' ? 'تم نسخ القالب كمسودة' : 'Template copied to drafts');
      setActiveTab('posts');
    } catch (e) {
      console.error(e);
    }
  };
`;

let lines = code.split('\n');
let startIndex = lines.findIndex(l => l.includes('// Append tags to the active post draft'));
let endIndex = lines.findIndex(l => l.includes('const handleApplyPresetTime ='));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex, goodRestCode);
  fs.writeFileSync('src/App.tsx', lines.join('\n'));
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}
