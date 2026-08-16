import datetime
from abc import ABC, abstractmethod
from typing import Optional, Union
from dataclasses import dataclass, field

@dataclass
class Note:
    title: str
    content: str
    is_locked: bool = False
    last_unlocked: datetime = field(default_factory=datetime.datetime.now)
    strategy: str = "Bio"

class AuthSession:
    def __init__(self, timeout_minutes: int = 10):
        self.active: bool = True
        self.timeout_minutes: int = timeout_minutes
        self.last_interaction: datetime = field(default_factory=datetime.datetime.now)

    def check_validity(self, note: Note) -> bool:
        now = datetime.datetime.now()
        diff = now - note.last_unlocked
        minutes_locked = diff.total_seconds() / 60
        
        if minutes_locked > self.timeout_minutes:
            return True # Needs re-auth
        return False

class PinProvider:
    def __init__(self, default: str = "1234"):
        self.default = default
        self.timeout = AuthSession()

    def authenticate(self, note: Note, code: str) -> bool:
        if code and code == self.default:
            note.last_unlocked = datetime.datetime.now()
            return True
        return False

class BioProvider:
    def authenticate(self, note: Note, biometric_data: str = None) -> bool:
        note.last_unlocked = datetime.datetime.now()
        return True

class NoteLocker:
    def __init__(self, provider: Optional[Union[PinProvider, BioProvider]] = None):
        self.provider = provider if provider else PinProvider()
        self.notes: dict[str, Note] = {}

    def add_note(self, title: str, content: str, lock: bool = False) -> Note:
        note = Note(title=title, content=content, is_locked=lock)
        self.notes[title] = note
        return note

    def toggle_lock(self, title: str) -> Optional[Note]:
        if title in self.notes:
            n = self.notes[title]
            n.is_locked = True
            n.last_unlocked = datetime.datetime.now()
            return n
        return None

    def unlock(self, title: str, code: str = "1234") -> bool:
        note = self.notes.get(title)
        if note and note.is_locked:
            # Check if session expired
            if self.provider.timeout.active:
                if self.provider.timeout.check_validity(note):
                     self.provider.timeout.last_interaction = datetime.datetime.now()
            
            if self.provider.authenticate(note, code):
                note.is_locked = False
                self.provider.timeout.last_interaction = datetime.datetime.now()
                return True
        return True

    def get_ui_state(self, title: str) -> str:
        note = self.notes.get(title)
        if not note:
            return "hidden"
        if note.is_locked:
            return "obscured"
        return note.content

    def re_authenticate(self, title: str, code: str = "1234") -> Optional[Note]:
        note = self.notes.get(title)
        if note and note.is_locked:
            # Check global session timeout
            now = datetime.datetime.now()
            diff = now - self.provider.timeout.last_interaction
            
            if diff.total_seconds() > (self.provider.timeout.timeout_minutes * 60):
                # Force re-auth
                return self.unlock(title, code)
        return note

    def get_session_info(self) -> dict:
        return {
            "active": self.provider.timeout.active,
            "minutes_left": (self.provider.timeout.timeout_minutes - 
                           (datetime.datetime.now() - self.provider.timeout.last_interaction).total_seconds()/60)
        }

if __name__ == "__main__":
    vault = NoteLocker(provider=PinProvider(default="1234"))

    # Create new note
    n1 = vault.add_note("My Secret", "Hidden Content")
    vault.add_note("Public Info", "Public Data")

    # Lock the new note
    vault.toggle_lock("My Secret")

    # Check UI State
    print(vault.get_ui_state("My Secret")) # "obscured"

    # Unlock it
    vault.unlock("My Secret")
    print(vault.get_ui_state("My Secret")) # "Hidden Content"

    # Simulate Restart (App restart resets global session)
    vault.provider.timeout.last_interaction = datetime.datetime.now()

    # Lock again
    vault.toggle_lock("My Secret")

    # Simulate Timeout
    vault.provider.timeout.timeout_minutes = 10
    
    # Check Session info
    print(vault.get_session_info())

    # Final Unlock
    vault.unlock("My Secret")
    
    # Test Re-auth logic
    vault.toggle_lock("My Secret")
    re_unlock = vault.re_authenticate("My Secret", code="1234")
    print(re_unlock is not None)