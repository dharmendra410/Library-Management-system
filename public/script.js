document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Logic ---
    const navItems = document.querySelectorAll('.sidebar li');
    const sections = document.querySelectorAll('.main-content section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(s => {
                s.classList.toggle('active', s.id === targetId);
            });
            if (targetId === 'catalog') fetchBooks();
            if (targetId === 'members') fetchMembers();
            if (targetId === 'lending') refreshLendingSelectors();
            if (targetId === 'reports') fetchReports();
        });
    });

    // --- Book Catalog Logic ---
    const getCoverUrl = (coverUrl, title = 'No Cover', size = '200x300') => {
        const normalized = typeof coverUrl === 'string'
            ? coverUrl.trim()
            : coverUrl != null
                ? String(coverUrl).trim()
                : '';
        if (normalized && normalized.toLowerCase() !== 'null' && normalized.toLowerCase() !== 'undefined') {
            return normalized;
        }
        return `https://placehold.co/${size}?text=${encodeURIComponent(title || 'No Cover')}`;
    };

    const fetchBooks = async () => {
        const searchInput = document.getElementById('bookSearch');
        const search = searchInput ? searchInput.value : '';
        try {
            const response = await fetch(`/api/books?search=${encodeURIComponent(search)}`);
            const books = await response.json();
            const grid = document.getElementById('bookGrid');
            grid.innerHTML = '';
            
            if (books.length === 0) {
                grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">No books found in your collection.</p>';
            }

            books.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card';
                card.style.background = 'var(--bg-white)';
                card.style.borderRadius = 'var(--radius-lg)';
                card.style.padding = '1.25rem';
                card.style.border = '1px solid var(--border)';
                card.style.boxShadow = 'var(--shadow-sm)';
                card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.position = 'relative';
                card.style.overflow = 'hidden';

                const coverUrl = book.coverUrl && book.coverUrl.trim()
                    ? book.coverUrl
                    : `https://placehold.co/200x300?text=${encodeURIComponent(book.title || 'No Cover')}`;

                card.innerHTML = `
                    <div style="position: relative; margin-bottom: 1rem; border-radius: 8px; overflow: hidden; height: 220px;">
                        <img src="${getCoverUrl(book.coverUrl, book.title, '200x300')}" onerror="this.onerror=null;this.src='https://placehold.co/200x300?text=No+Cover'" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;">
                        <div class="status-badge ${book.status === 'Available' ? 'available' : 'borrowed'}" style="position: absolute; top: 10px; right: 10px; z-index: 1;">
                            ${book.status}
                        </div>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${book.title}">${book.title}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.75rem;">${book.author}</p>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 1rem;">
                            <span style="font-size: 0.75rem; background: var(--primary-light); color: var(--primary); padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                                ${book.category || 'Books'}
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border);">
                        <button class="btn-outline" style="padding: 0.5rem; color: #64748b; border-color: #e2e8f0; width: auto;" onclick="deleteBook('${book.id}')" title="Delete Book">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <button class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="openEditBook('${book.id}')">
                            Edit
                        </button>
                    </div>
                `;
                
                // Add hover effect via JS since it's dynamically created
                card.onmouseenter = () => {
                    card.style.transform = 'translateY(-5px)';
                    card.style.boxShadow = 'var(--shadow-lg)';
                    card.style.borderColor = 'var(--primary)';
                    card.querySelector('img').style.transform = 'scale(1.05)';
                };
                card.onmouseleave = () => {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = 'var(--shadow-sm)';
                    card.style.borderColor = 'var(--border)';
                    card.querySelector('img').style.transform = 'scale(1)';
                };

                grid.appendChild(card);
            });
        } catch (err) { console.error('Error fetching books:', err); }
    };

    window.exploreGenre = (genre) => {
        const container = document.getElementById('suggestedBooksContainer');
        const heading = document.getElementById('suggestionHeading');
        
        container.style.display = 'block';
        heading.innerHTML = `<i class="fas fa-lightbulb"></i> Suggested ${genre} Books`;
        
        const suggestions = {
            'Fiction': [
                { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565' },
                { title: '1984', author: 'George Orwell', isbn: '9780451524935' },
                { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084' },
                { title: 'Brave New World', author: 'Aldous Huxley', isbn: '9780060850524' },
                { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '9780316769488' },
                { title: 'The Night Circus', author: 'Erin Morgenstern', isbn: '9780307744432' },
                { title: 'The Goldfinch', author: 'Donna Tartt', isbn: '9780316055444' },
                { title: 'The Shadow of the Wind', author: 'Carlos Ruiz Zafón', isbn: '9780143034902' }
            ],
            'Non-Fiction': [
                { title: 'Educated', author: 'Tara Westover', isbn: '9780399588587' },
                { title: 'Becoming', author: 'Michelle Obama', isbn: '9781524763138' },
                { title: 'Quiet', author: 'Susan Cain', isbn: '9780307352156' },
                { title: 'The Tipping Point', author: 'Malcolm Gladwell', isbn: '9780316346627' },
                { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292' },
                { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557' },
                { title: 'Born a Crime', author: 'Trevor Noah', isbn: '9780399588198' }
            ],
            'Science': [
                { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163' },
                { title: 'Cosmos', author: 'Carl Sagan', isbn: '9780345539434' },
                { title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '9780199291151' },
                { title: 'Astrophysics', author: 'Neil deGrasse Tyson', isbn: '9780393609394' },
                { title: 'The Gene', author: 'Siddhartha Mukherjee', isbn: '9781476733524' },
                { title: 'The Elegant Universe', author: 'Brian Greene', isbn: '9780393338102' },
                { title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', isbn: '9781400052189' }
            ],
            'Technology': [
                { title: 'Steve Jobs', author: 'Walter Isaacson', isbn: '9781451648539' },
                { title: 'The Innovators', author: 'Walter Isaacson', isbn: '9781476708690' },
                { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884' },
                { title: 'Zero to One', author: 'Peter Thiel', isbn: '9780804139298' },
                { title: 'The Phoenix Project', author: 'Gene Kim', isbn: '9781942788294' },
                { title: 'Hooked', author: 'Nir Eyal', isbn: '9781591847786' },
                { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780201616224' }
            ],
            'History': [
                { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097' },
                { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '9780393317558' },
                { title: 'The Silk Roads', author: 'Peter Frankopan', isbn: '9781101912379' },
                { title: 'SPQR', author: 'Mary Beard', isbn: '9780871404220' },
                { title: 'The Wright Brothers', author: 'David McCullough', isbn: '9781476728759' },
                { title: 'The Diary of a Young Girl', author: 'Anne Frank', isbn: '9780553296983' },
                { title: 'The Second World War', author: 'Antony Beevor', isbn: '9780316023740' }
            ],
            'Art': [
                { title: 'The Story of Art', author: 'E.H. Gombrich', isbn: '9780714832470' },
                { title: 'Ways of Seeing', author: 'John Berger', isbn: '9780140135152' },
                { title: 'Interaction of Color', author: 'Josef Albers', isbn: '9780300179354' },
                { title: 'Just Kids', author: 'Patti Smith', isbn: '9780066211311' },
                { title: 'Steal Like an Artist', author: 'Austin Kleon', isbn: '9780761169253' },
                { title: 'The Art Book', author: 'Phaidon Press', isbn: '9780714875734' },
                { title: 'The Lives of the Artists', author: 'Giorgio Vasari', isbn: '9780199537198' }
            ]
        };

        const list = suggestions[genre] || [];
        renderSuggestions(list, genre, 3);
    };

    const renderSuggestions = (list, genre, limit) => {
        const grid = document.getElementById('suggestionGrid');
        grid.innerHTML = '';
        
        const visible = list.slice(0, limit);
        visible.forEach(book => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            const coverUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`;
            item.innerHTML = `
                <img src="${coverUrl}" onerror="this.onerror=null;this.src='https://placehold.co/150x225?text=No+Cover'" style="width: 100%; aspect-ratio: 2/3; border-radius: 8px; object-fit: cover; margin-bottom: 1rem; box-shadow: var(--shadow-sm);">
                <h4 style="margin-bottom: 5px;">${book.title}</h4>
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 15px;">${book.author}</p>
                <button class="btn-add-quick" onclick="quickAdd('${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}', '${genre}')">Add to Library</button>
            `;
            grid.appendChild(item);
        });

        if (limit < list.length) {
            const moreBtn = document.createElement('button');
            moreBtn.className = 'btn-outline';
            moreBtn.style.gridColumn = '1 / -1';
            moreBtn.style.marginTop = '1rem';
            moreBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Show All Options';
            moreBtn.onclick = () => renderSuggestions(list, genre, list.length);
            grid.appendChild(moreBtn);
        }
    };

    window.resetSearch = () => {
        document.getElementById('bookSearch').value = '';
        document.getElementById('suggestedBooksContainer').style.display = 'none';
        fetchBooks();
    };

    const resetBookForm = () => {
        const titleField = document.getElementById('bookTitle');
        const authorField = document.getElementById('bookAuthor');
        const categoryField = document.getElementById('bookCategory');
        const idField = document.getElementById('bookId');
        const modalTitle = document.getElementById('bookModalTitle');

        if (titleField) titleField.value = '';
        if (authorField) authorField.value = '';
        if (categoryField) categoryField.value = '';
        if (idField) idField.value = '';
        if (modalTitle) modalTitle.innerText = 'Add New Book';
    };

    window.openModal = (id) => {
        if (id === 'bookModal') resetBookForm();
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'block';
    };

    window.openEditBook = async (id) => {
        try {
            const response = await fetch('/api/books');
            if (!response.ok) return;
            const books = await response.json();
            const book = books.find(b => b.id === id);
            if (!book) return;

            const titleField = document.getElementById('bookTitle');
            const authorField = document.getElementById('bookAuthor');
            const categoryField = document.getElementById('bookCategory');
            const idField = document.getElementById('bookId');
            const modalTitle = document.getElementById('bookModalTitle');

            if (titleField) titleField.value = book.title;
            if (authorField) authorField.value = book.author;
            if (categoryField) categoryField.value = book.category || '';
            if (idField) idField.value = book.id;
            if (modalTitle) modalTitle.innerText = 'Edit Book';

            const modal = document.getElementById('bookModal');
            if (modal) modal.style.display = 'block';
        } catch (err) {
            console.error('Error opening edit modal:', err);
        }
    };

    window.closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    };

    const bookSearch = document.getElementById('bookSearch');
    if (bookSearch) bookSearch.addEventListener('input', fetchBooks);

    window.importByISBN = async () => {
        const isbnInput = document.getElementById('isbnInput');
        if (!isbnInput || !isbnInput.value) { alert('Please enter an ISBN'); return; }
        const isbn = isbnInput.value;
        const response = await fetch('/api/books/import/' + isbn);
        if (response.ok) {
            alert('Book imported using Open Library API!');
            isbnInput.value = '';
            window.closeModal('isbnModal');
            fetchBooks();
        } else {
            const err = await response.json();
            alert('Import failed: ' + err.error);
        }
    };

    window.addBook = async () => {
        const id = document.getElementById('bookId').value;
        const titleField = document.getElementById('bookTitle');
        const authorField = document.getElementById('bookAuthor');
        const categoryField = document.getElementById('bookCategory');

        const title = titleField?.value || '';
        const author = authorField?.value || 'Unknown Author';
        const category = categoryField?.value || 'Uncategorized';

        console.log('[addBook] Starting book save process', { id, title, author, category, isEdit: !!id });

        if (!title && !category) {
            console.warn('[addBook] Validation failed: no title or category provided');
            alert('Please provide at least a Title or select a Category');
            return;
        }

        const finalTitle = title || `New ${category} Book`;
        const payload = { title: finalTitle, author, category };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/books/${id}` : '/api/books';

        console.log(`[addBook] Sending ${method} request to ${url}`, payload);

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log(`[addBook] Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

            if (response.ok) {
                const savedBook = await response.json();
                console.log('[addBook] Success! Book saved to database:', savedBook);
                window.closeModal('bookModal');
                resetBookForm();
                fetchBooks();
            } else {
                let errorMsg = 'Failed to save book.';
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const error = await response.json();
                        errorMsg = error.error || errorMsg;
                        console.error('[addBook] Error response from server:', error);
                    } catch (e) {
                        console.error('[addBook] Failed to parse error response:', e);
                    }
                } else {
                    const text = await response.text();
                    console.error('[addBook] Non-JSON error response:', { status: response.status, text: text.substring(0, 200) });
                }
                alert(errorMsg);
            }
        } catch (err) {
            console.error('[addBook] Network or fetch error:', err);
            alert('Network error: ' + err.message);
        }
    };

    window.quickAdd = async (title, author, category) => {
        const response = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, author, category })
        });
        if (response.ok) {
            alert(`${title} added to library!`);
            fetchBooks();
        }
    };

    window.searchOpenLibrary = async () => {
        const query = document.getElementById('bookSearch')?.value || '';
        if (!query || query.trim().length < 2) {
            alert('Please enter at least 2 characters to search');
            return;
        }

        try {
            const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();

            if (results.error) {
                alert(results.error);
                return;
            }

            const container = document.getElementById('suggestedBooksContainer');
            const heading = document.getElementById('suggestionHeading');
            container.style.display = 'block';
            heading.innerHTML = `<i class="fas fa-search"></i> Search Results for "${query}"`;

            const grid = document.getElementById('suggestionGrid');
            grid.innerHTML = '';

            results.forEach(book => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `
                    <img src="${book.coverUrl}" onerror="this.onerror=null;this.src='https://placehold.co/150x225?text=No+Cover'" style="width: 100%; aspect-ratio: 2/3; border-radius: 8px; object-fit: cover; margin-bottom: 1rem; box-shadow: var(--shadow-sm);">
                    <h4 style="margin-bottom: 5px;">${book.title}</h4>
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 15px;">${book.author}</p>
                    <button class="btn-add-quick" onclick="quickAdd('${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}', '${book.subjects?.[0] || 'Uncategorized'}')">Add to Library</button>
                `;
                grid.appendChild(item);
            });
        } catch (err) {
            console.error('Error searching Open Library:', err);
            alert('Failed to search Open Library');
        }
    };

    window.deleteBook = async (id) => {
        if (!confirm('Delete this book?')) return;
        const response = await fetch('/api/books/' + id, { method: 'DELETE' });
        if (response.ok) fetchBooks();
        else {
            const err = await response.json();
            alert(err.error);
        }
    };

    // --- Member Management Logic ---
    const fetchMembers = async () => {
        try {
            const response = await fetch('/api/members');
            const members = await response.json();
            const list = document.getElementById('memberList');
            list.innerHTML = '';
            members.forEach(member => {
                const card = document.createElement('div');
                card.className = 'member-card';
                card.style.display = 'flex';
                card.style.justifyContent = 'space-between';
                card.style.alignItems = 'center';
                card.style.padding = '1.25rem';
                card.style.background = 'var(--bg-white)';
                card.style.borderRadius = 'var(--radius-lg)';
                card.style.border = '1px solid var(--border)';
                card.style.marginBottom = '1rem';
                card.style.boxShadow = 'var(--shadow-sm)';
                card.style.transition = 'all 0.2s';
                
                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 48px; height: 48px; background: var(--primary-light); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem;">
                            ${member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 700; color: var(--text-main); font-size: 1.1rem;">${member.name}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${member.email}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="text-align: right;">
                            <span class="status-badge ${member.activeLoansCount > 0 ? 'borrowed' : 'available'}" style="display: inline-block; margin-bottom: 4px;">
                                ${member.activeLoansCount || 0} Active Loans
                            </span>
                        </div>
                        <button class="btn-outline" style="padding: 0.5rem 1rem;" onclick="viewMember('${member.id}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                    </div>
                `;
                list.appendChild(card);
            });
        } catch (err) { console.error('Error fetching members:', err); }
    };

    window.addMember = async () => {
        const name = document.getElementById('memberName').value;
        const email = document.getElementById('memberEmail').value;
        if (!name || !email) { alert('Name and Email required'); return; }
        const response = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });
        if (response.ok) {
            window.closeModal('memberModal');
            document.getElementById('memberName').value = '';
            document.getElementById('memberEmail').value = '';
            fetchMembers();
        }
    };

    window.viewMember = async (id) => {
        const response = await fetch('/api/members/' + id);
        const data = await response.json();
        let loanText = data.loans.length > 0 
            ? data.loans.map(l => l.book.title + ' (Due: ' + new Date(l.dueDate).toLocaleDateString() + ')').join('\n')
            : 'No active loans';
        alert('Name: ' + data.name + '\nLoans:\n' + loanText);
    };

    // --- Lending & Returns Logic ---
    const refreshLendingSelectors = async () => {
        try {
            const [booksRes, membersRes] = await Promise.all([fetch('/api/books'), fetch('/api/members')]);
            const books = await booksRes.json();
            const members = await membersRes.json();
            
            const bookSelect = document.getElementById('loanBookId');
            const memberSelect = document.getElementById('loanMemberId');
            
            if (bookSelect) bookSelect.innerHTML = '<option value="">Select Book</option>' + 
                books.map(b => `<option value="${b.id}">${b.title} (${b.status})</option>`).join('');
                
            if (memberSelect) memberSelect.innerHTML = '<option value="">Select Member</option>' + 
                members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

            const activeLoansRes = await fetch('/api/loans/active');
            const activeLoansContainer = document.getElementById('activeLoans');
            if (activeLoansRes.ok && activeLoansContainer) {
                const activeLoans = await activeLoansRes.json();
                activeLoansContainer.innerHTML = activeLoans.map(l => `
                    <div style="background: var(--bg-white); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 0.75rem; box-shadow: var(--shadow-sm); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <img src="${getCoverUrl(l.book.coverUrl, l.book.title, '40x60')}" onerror="this.onerror=null;this.src='https://placehold.co/40x60?text=No+Cover'" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;">
                            <div>
                                <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${l.book.title}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);"><i class="fas fa-user"></i> ${l.member.name}</div>
                                <div style="font-size: 0.8rem; color: #ef4444; margin-top: 2px;"><i class="fas fa-clock"></i> Due: ${new Date(l.dueDate).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <button class="btn-outline" style="padding: 0.5rem 0.8rem; color: #ef4444; border-color: #fecaca;" onclick="window.returnBook('${l.book.id}')">
                            <i class="fas fa-undo"></i> Return
                        </button>
                    </div>
                `).join('') || '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No active loans</div>';
            }
        } catch (err) { console.error('Error refreshing selectors:', err); }
    };

    window.issueBook = async () => {
        const bookId = document.getElementById('loanBookId').value;
        const memberId = document.getElementById('loanMemberId').value;
        if (!bookId || !memberId) { alert('Please select both a book and a member'); return; }
        const response = await fetch('/api/lend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, memberId })
        });
        const result = await response.json();
        alert(result.message || result.error);
        refreshLendingSelectors();
        fetchBooks();
    };

    window.returnBook = async (bookId) => {
        if (!bookId) return;
        const response = await fetch('/api/return/' + bookId, { method: 'POST' });
        const result = await response.json();
        alert(result.message || result.error);
        refreshLendingSelectors();
        fetchBooks();
    };

    // --- Reports Logic ---
    const fetchReports = async () => {
        try {
            const [topRes, overdueRes, waitlistRes] = await Promise.all([
                fetch('/api/reports/top-books'),
                fetch('/api/reports/overdue'),
                fetch('/api/members') // Using members to find any with waitlist logic (simulated)
            ]);
            
            const top = await topRes.json();
            const overdue = await overdueRes.json();
            
            // 1. Most Popular Books
            const popularList = document.getElementById('popularBooks');
            if (popularList) {
                popularList.innerHTML = top.map(b => `
                    <li style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 8px; background: var(--bg-main); border-radius: 8px;">
                        <img src="${getCoverUrl(b.coverUrl, b.title, '30x45')}" onerror="this.onerror=null;this.src='https://placehold.co/30x45?text=?'" style="width: 30px; height: 45px; border-radius: 2px; object-fit: cover;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem;">${b.title}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${b.checkoutCount} checkouts</div>
                        </div>
                        <div style="color: var(--primary);"><i class="fas fa-chart-line"></i></div>
                    </li>
                `).join('') || '<p style="text-align: center; color: var(--text-muted);">No checkout history yet.</p>';
            }

            // 2. Overdue Books
            const overdueList = document.getElementById('overdueBooks');
            if (overdueList) {
                overdueList.innerHTML = overdue.map(item => `
                    <li style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 8px; border: 1px dashed var(--danger); border-radius: 8px; color: var(--danger);">
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 0.9rem;">${item.book.title}</div>
                            <div style="font-size: 0.8rem;">Held by: ${item.member.name}</div>
                            <div style="font-size: 0.75rem; font-weight: 600;">Due: ${new Date(item.dueDate).toLocaleDateString()}</div>
                        </div>
                        <i class="fas fa-exclamation-triangle"></i>
                    </li>
                `).join('') || '<p style="text-align: center; color: var(--success); font-size: 0.9rem; padding: 1rem;"><i class="fas fa-check-circle"></i> No overdue books!</p>';
            }

            // 3. Active Waitlists (Simulated / Simplified)
            const waitlistUl = document.getElementById('activeWaitlists');
            if (waitlistUl) {
                // In this system, we show books that are currently borrowed as potential waitlist targets
                const booksRes = await fetch('/api/books');
                const allBooks = await booksRes.json();
                const borrowedBooks = allBooks.filter(b => b.status === 'Borrowed');
                
                waitlistUl.innerHTML = borrowedBooks.map(b => `
                    <li style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 8px; background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem; color: #92400e;">${b.title}</div>
                            <div style="font-size: 0.8rem; color: #b45309;">Next available soon</div>
                        </div>
                        <span class="status-badge" style="background: #fef3c7; color: #92400e; font-size: 0.75rem;">Reserved</span>
                    </li>
                `).join('') || '<p style="text-align: center; color: var(--text-muted);">No active waitlists.</p>';
            }

        } catch (err) { console.error('Error fetching reports:', err); }
    };

    // Initial load
    fetchBooks();
});
