import React, { Component } from "react";
import axios from "axios";
import moment from 'moment';
import '../styles/note.css';

class Note extends Component {
  state = {
    notes: [],
    newNote: { title: "", content: "", category: "" },
    editingNoteId: null,
    error: null,
    searchQuery: '',
    selectedCategory: '',
    categories: ['Personal', 'Work', 'Study', 'Other'],
  };

  componentDidMount() {
    this.fetchNotes();
  }

  fetchNotes = async () => {
    const token = localStorage.getItem("jwtToken");

    if (!token) {
      this.setState({ error: "No JWT Token found. Please log in." });
      return;
    }

    try {
      const response = await axios.get("https://notes-backend-8fni.onrender.com/notes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      this.setState({ notes: response.data });
    } catch (error) {
      this.setState({ error: "Error fetching notes. Please log in again." });
    }
  };

  handleAddNote = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.post(
        "https://notes-backend-8fni.onrender.com/notes",
        { ...this.state.newNote },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      this.setState((prevState) => ({
        notes: [...prevState.notes, response.data],
        newNote: { title: "", content: "", category: "" },
      }));
    } catch (error) {
      this.setState({ error: "Error adding note." });
    }
  };

  handleDeleteNote = async (id) => {
    const token = localStorage.getItem("jwtToken");

    try {
      await axios.delete(`https://notes-backend-8fni.onrender.com/notes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      this.setState((prevState) => ({
        notes: prevState.notes.filter((note) => note.id !== id),
      }));
    } catch (error) {
      this.setState({ error: "Error deleting note." });
    }
  };

  handleEditNote = (id) => {
    const { notes } = this.state;
    const note = notes.find((note) => note.id === id);
    this.setState({
      newNote: {
        title: note.title,
        content: note.content,
        category: note.category,
      },
      editingNoteId: id,
    });
  };

  handleSaveEdit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");

    try {
      await axios.put(
        `https://notes-backend-8fni.onrender.com/notes/${this.state.editingNoteId}`,
        { ...this.state.newNote },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      this.setState((prevState) => ({
        notes: prevState.notes.map((note) =>
          note.id === prevState.editingNoteId
            ? { ...note, ...prevState.newNote }
            : note
        ),
        newNote: { title: "", content: "", category: "" },
        editingNoteId: null,
      }));
    } catch (error) {
      this.setState({ error: "Error updating note." });
    }
  };

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  handleCategoryChange = (e) => {
    this.setState({ selectedCategory: e.target.value });
  };

  render() {
    const { notes, newNote, editingNoteId, error, searchQuery, selectedCategory, categories } = this.state;

    const filteredNotes = notes.filter((note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div>
        <h2>Your Notes</h2>

        <div className="filters">
          <input
            type="text"
            placeholder="Search by title"
            value={searchQuery}
            onChange={this.handleSearchChange}
          />
          <select onChange={this.handleCategoryChange} value={selectedCategory}>
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={editingNoteId ? this.handleSaveEdit : this.handleAddNote}>
          <input
            type="text"
            placeholder="Title"
            value={newNote.title}
            onChange={(e) =>
              this.setState({ newNote: { ...newNote, title: e.target.value } })
            }
            required
          />
          <textarea
            placeholder="Content"
            value={newNote.content}
            onChange={(e) =>
              this.setState({ newNote: { ...newNote, content: e.target.value } })
            }
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={newNote.category}
            onChange={(e) =>
              this.setState({ newNote: { ...newNote, category: e.target.value } })
            }
          />
          <button type="submit">{editingNoteId ? "Save Edit" : "Add Note"}</button>
        </form>

        {error && <p>{error}</p>}

        <div className="notes-container">
          {filteredNotes.map((note) => (
            <div key={note.id} className="note-card">
              <h3>{note.title}</h3>
              <p>{note.content}</p>
              <p><strong>Category:</strong> {note.category}</p>
              <p><strong>Created:</strong> {moment(note.created_at).format('MMMM Do YYYY, h:mm:ss a')}</p>
              <p><strong>Last Updated:</strong> {moment(note.updated_at).format('MMMM Do YYYY, h:mm:ss a')}</p>
              <div className="note-actions">
                <button onClick={() => this.handleEditNote(note.id)}>Edit</button>
                <button className="delete" onClick={() => this.handleDeleteNote(note.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default Note;
