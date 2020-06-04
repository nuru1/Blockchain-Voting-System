pragma solidity >=0.4.24 <0.6.0;

contract Election {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store Candidates
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    // Store Candidates Count
    uint public candidatesCount;

    bool public isElectionStarted = false;
    
    address[] public votersAddress;
    
    uint votersCount;

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );
    
    event resetEvent();
    event controlEvent(bool ElectionStatus);

    /*function Election () public {
        //addCandidate("Candidate 1");
        //addCandidate("Candidate 2");
    }*/

    function addCandidate (string memory _name) public {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function ElectionControl(bool decision) public {
        isElectionStarted = decision;
        emit controlEvent(decision);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender],"Only one vote per user");

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        require(isElectionStarted,"Election didn't start");
    
        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        votersAddress.push(msg.sender);
        
        votersCount++;

        // trigger voted event
        emit votedEvent(_candidateId);
    }
    
    function resetElection() public{
        require(!isElectionStarted,"Stop election first!");
        
        for(uint i=1; i<=candidatesCount; i++){
            delete candidates[i];
        }
        
        for(uint i=0; i<votersCount;i++){
            voters[votersAddress[i]]=false;
        }
        delete candidatesCount;
        delete votersAddress;
        delete votersCount;

        emit resetEvent();   
    }
}
