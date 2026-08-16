from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional, Any
import json

class VoteMode(Enum):
    SINGLE = "single"
    MULTIPLE = "multiple"

class PollStatus(Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    EXPIRED = "expired"

@dataclass
class PollOption:
    id: str
    text: str
    color: str
    votes: int
    is_active: bool = True
    
    def get_percentage(self, total_participants: int) -> float:
        if total_participants <= 0:
            return 0.0
        return round((self.votes / total_participants) * 100, 1)
    
    def update_vote(self, increment: int = 1) -> None:
        self.votes += increment

@dataclass
class GroupVoter:
    id: str
    name: str
    avatar: str
    options_selected: List[str]
    
    def is_option_voted(self, option_id: str) -> bool:
        return option_id in self.options_selected

    def get_name_for_ui(self) -> str:
        return self.name or f"Voter {self.id}"

@dataclass
class WarpSpeedPoll:
    id: str
    question: str
    mode: VoteMode = VoteMode.SINGLE
    status: PollStatus = PollStatus.ACTIVE
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    max_options: int = 12
    question_limit: int = 255
    total_participants: int = 1 
    options: List[PollOption] = field(default_factory=list)
    voters: Dict[str, GroupVoter] = field(default_factory=dict)

    def add_option(self, text: str, color: str = "#2196F3") -> Optional[PollOption]:
        if len(self.options) >= self.max_options:
            return None
            
        limit_text = text if len(text) <= self.question_limit else text[:self.question_limit]
        opt = PollOption(id=f"{self.id}_{len(self.options)}", text=limit_text, color=color, votes=0, is_active=True)
        self.options.append(opt)
        return opt

    def cast_vote(self, voter_id: str, option_id: str, increment: int = 1) -> Optional[PollOption]:
        if voter_id not in self.voters:
            self.voters[voter_id] = GroupVoter(
                id=voter_id, 
                name=f"User_{voter_id}", 
                avatar="avatar_default", 
                options_selected=[]
            )
        
        voter = self.voters[voter_id]
        
        if self.mode == VoteMode.MULTIPLE:
            if option_id not in voter.options_selected:
                voter.options_selected.append(option_id)
        else: # SINGLE
            # In single mode, replace first selection
            if voter.options_selected and len(voter.options_selected) == 1 and voter.options_selected[0] == option_id:
                pass # Keep existing
            else:
                voter.options_selected.clear()
                voter.options_selected.append(option_id)
                
        # Increment the specific option's votes
        target_opt = next((opt for opt in self.options if opt.id == option_id), None)
        if target_opt:
            target_opt.update_vote(increment)
            
        self.updated_at = datetime.now()
        return target_opt

    def update_participant_count(self, count: int) -> None:
        self.total_participants = count

    def get_full_results(self) -> Dict[str, Any]:
        results = {
            "id": self.id,
            "question": self.question,
            "mode": self.mode.value,
            "status": self.status.value,
            "options": [],
            "voters": []
        }
        
        for opt in self.options:
            results["options"].append({
                "id": opt.id,
                "text": opt.text,
                "color": opt.color,
                "votes": opt.votes,
                "percentage": opt.get_percentage(self.total_participants),
                "is_voted": any(v for v in self.voters.values() if opt.id in v.options_selected)
            })
            
        for vid, voter in self.voters.items():
            results["voters"].append({
                "id": vid,
                "name": voter.name,
                "avatar": voter.avatar,
                "options": voter.options_selected
            })
            
        return results

    def get_voters_for_option(self, option_id: str) -> List[str]:
        voters = []
        for voter in self.voters.values():
            if option_id in voter.options_selected:
                voters.append(voter.name)
        return voters

    def get_top_voter(self) -> Optional[str]:
        max_votes = 0
        top_voter_id = None
        for opt in self.options:
            if opt.votes > max_votes:
                max_votes = opt.votes
                top_voter_id = opt.id
        # Get name for that option
        if top_voter_id:
            return self.get_voters_for_option(top_voter_id)
        return None

    def close_poll(self) -> None:
        self.status = PollStatus.CLOSED

    def clone(self) -> 'WarpSpeedPoll':
        new = WarpSpeedPoll(
            id=self.id,
            question=self.question,
            mode=self.mode,
            status=self.status,
            max_options=self.max_options,
            question_limit=self.question_limit,
            total_participants=self.total_participants,
            options=[PollOption(id=o.id, text=o.text, color=o.color, votes=o.votes, is_active=True) for o in self.options],
            voters=dict(self.voters)
        )
        return new

def create_initial_poll(question: str = "New Group Poll", mode: str = VoteMode.SINGLE.value) -> WarpSpeedPoll:
    return WarpSpeedPoll(id="p_1", question=question, mode=VoteMode(mode))

def setup_poll_ui_data(poll: WarpSpeedPoll) -> Dict:
    return {
        "title": poll.question,
        "headerColor": "#1A237E",
        "options": [
            {
                "id": opt.id,
                "text": opt.text,
                "color": opt.color,
                "voteCount": opt.votes
            } for opt in poll.options
        ]
    }

# Example usage / Entry point
if __name__ == "__main__":
    p = create_initial_poll(question="Who is the MVP?")
    p.add_option("Alice")
    p.add_option("Bob", color="#00E676")
    p.add_option("Charlie")
    
    p.total_participants = 5
    p.cast_vote("u_101", "p_1_0") # Alice voted
    p.cast_vote("u_102", "p_1_1") # Bob voted
    
    print(json.dumps(p.get_full_results(), indent=2, default=str))