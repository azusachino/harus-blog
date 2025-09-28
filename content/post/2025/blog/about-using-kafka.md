---
title: What I know about kafka
created: 2024-01-04 04:01:00
modified: 2024-01-09 11:32:34
description: an unease trip
date: 2025-06-01
status: released
slug: what-i-know-about-kafka
image: images/2025/MonaValePool.png
categories:
  - Learning
tags:
  - Java
  - Learning
  - Middleware
---

Apache Kafka is a distributed event streaming platform designed for high-throughput, fault-tolerant, real-time data streaming. It provides a unified, high-performance solution for handling real-time data feeds. Kafka is built to be horizontally scalable, reliably store massive amounts of data, and connect disparate data sources and sinks.

## full architecture

```mermaid
graph TD
    subgraph Client Applications
        A[Producer Clients]
        B[Consumer Clients]
        C[Admin Clients]
        D[Streams Applications]
    end

    A -- Produces messages --> E["Broker(Controller) Nodes"]
    B -- Consumes messages --> E
    C -- Management operations --> E
    D -- Process, transform --> E

    subgraph Kafka Cluster
        E --> F[Socket Server]
        F -- Route Requests --> G[KafkaApis/ControllerApis]
        G -- Request Processor --> H[ReplicaManager]
        H -- Manages --> J[LogManager]
        J -- "Topic Partitions" --> K[Storage]

        G --> L[GroupCoordinator]
        G --> M[TransactionCoordinator]

        subgraph Coordinator Services
            L -- "Coordinator Services" --> N[QuorumController]
            M -- "Coordinator Services" --> N
        end

        N -- "KRaft Controller" --> O[KRaft Controller]
        O --> P[Kafka Broker]
        P -- "Metadata updates" --> G
    end
```

## replica management

create a topic with 3 partition and 2 replication factor, we will have a kafka cluster like this:

```mermaid
graph TD
    subgraph "Kafka Cluster (3 Nodes)"
        Node1["Kafka Broker 1"]
        Node2["Kafka Broker 2"]
        Node3["Kafka Broker 3"]
    end

    Topic["MyTopic (3 Partitions, RF=2)"]

    %% Connect Topic to its logical Partitions
    Topic -- "Has" --> P0["Partition 0"]
    Topic -- "Has" --> P1["Partition 1"]
    Topic -- "Has" --> P2["Partition 2"]

    %% Assign Partition 0 replicas to nodes
    Node1 -- "Hosts Leader" --> P0L["P0 (Leader)"]
    Node2 -- "Hosts Follower" --> P0F["P0 (Follower)"]

    %% Assign Partition 1 replicas to nodes
    Node2 -- "Hosts Leader" --> P1L["P1 (Leader)"]
    Node3 -- "Hosts Follower" --> P1F["P1 (Follower)"]

    %% Assign Partition 2 replicas to nodes
    Node3 -- "Hosts Leader" --> P2L["P2 (Leader)"]
    Node1 -- "Hosts Follower" --> P2F["P2 (Follower)"]

    %% Styling for clarity
    classDef broker_style fill:#E0F7FA,stroke:#333,stroke-width:2px;
    class Node1,Node2,Node3 broker_style;

    classDef topic_style fill:#D1C4E9,stroke:#333,stroke-width:2px;
    class Topic topic_style;

    classDef partition_base_style fill:#FFFDE7,stroke:#333,stroke-width:1px;
    class P0,P1,P2 partition_base_style;

    classDef leader_replica_style fill:#A2D9CE,stroke:#333,stroke-width:1px;
    class P0L,P1L,P2L leader_replica_style;

    classDef follower_replica_style fill:#F4D03F,stroke:#333,stroke-width:1px;
    class P0F,P1F,P2F follower_replica_style;

    linkStyle 0,1,2 stroke-width:0px;
```

How did partitions get handled? there are two critical components: ReplicaManager and Partition.

`ReplicaManager` key responsibilities:

- manages local partition replicas
  - `protected val allPartitions = new ConcurrentHashMap[TopicPartition, HostedPartition]`
- handles log appends, fetches, truncations, and high watermark management
- coordinates with fetcher threads for replication from leaders to followers
  - `ReplicaFetcherManager`
- manages ISRs (in sync replica) set and triggerrs actions when replicas fall out of sync
  - startup() --> `scheduler.schedule("isr-expiration", () => maybeShrinkIsr(), 0L, config.replicaLagTimeMaxMs / 2)`
- handles partition leadership changes (role change) as directed by the controller
  - `becomeLeaderOrFollower`
- cleans up resources and metrics for partitions as needed

`Partition` Data structure that represents a topic partition.

the sequence diagram of creating new topic was as followed.

```mermaid
sequenceDiagram
    participant AdminClient
    participant Controller
    participant Broker1
    participant Broker2
    participant ReplicaManager1 as ReplicaManager (Broker1)
    participant ReplicaManager2 as ReplicaManager (Broker2)

    AdminClient->>Controller: CreateTopicsRequest
    Controller->>Controller: Update metadata, assign partitions/replicas
    Controller->>Broker1: LeaderAndIsrRequest (partition assignment)
    Controller->>Broker2: LeaderAndIsrRequest (partition assignment)
    Broker1->>ReplicaManager1: becomeLeaderOrFollower()
    Broker2->>ReplicaManager2: becomeLeaderOrFollower()
    ReplicaManager1->>ReplicaManager1: Create Partition(s), initialize log(s)
    ReplicaManager2->>ReplicaManager2: Create Partition(s), initialize log(s)
    ReplicaManager1-->>Broker1: Partition ready
    ReplicaManager2-->>Broker2: Partition ready
    Broker1-->>Controller: LeaderAndIsrResponse
    Broker2-->>Controller: LeaderAndIsrResponse
    Controller-->>AdminClient: CreateTopicsResponse
```

## group coordinating

Group coordination in KRaft mode handles consumer group membership, partition assignment, and offset management.

the workflow of partition assign.

```mermaid
sequenceDiagram
    participant C1 as Consumer 1
    participant C2 as Consumer 2
    participant C3 as Consumer 3
    participant GC as GroupCoordinator

    Note over C1,GC: Phase 1: Join Group
    C1->>GC: JoinGroupRequest(groupId, memberId="", protocols)
    C2->>GC: JoinGroupRequest(groupId, memberId="", protocols)
    C3->>GC: JoinGroupRequest(groupId, memberId="", protocols)

    GC->>GC: Wait for all members or timeout
    GC->>GC: Select group leader (first to join)

    GC-->>C1: JoinGroupResponse(leader=true, members=[C1,C2,C3])
    GC-->>C2: JoinGroupResponse(leader=false, members=[])
    GC-->>C3: JoinGroupResponse(leader=false, members=[])

    Note over C1,GC: Phase 2: Sync Group
    C1->>C1: Perform partition assignment
    C1->>GC: SyncGroupRequest(groupId, assignments)
    C2->>GC: SyncGroupRequest(groupId, assignments=[])
    C3->>GC: SyncGroupRequest(groupId, assignments=[])

    GC-->>C1: SyncGroupResponse(assignment=[P0])
    GC-->>C2: SyncGroupResponse(assignment=[P1])
    GC-->>C3: SyncGroupResponse(assignment=[P2])

    Note over C1,GC: Phase 3: Heartbeat & Normal Operation
    loop Every session.timeout.ms/3
        C1->>GC: HeartbeatRequest
        C2->>GC: HeartbeatRequest
        C3->>GC: HeartbeatRequest
        GC-->>C1: HeartbeatResponse
        GC-->>C2: HeartbeatResponse
        GC-->>C3: HeartbeatResponse
    end
```

## log management

the sequence diagram of create new log file.

```mermaid
sequenceDiagram
    participant AdminClient
    participant Controller
    participant Broker
    participant ReplicaManager
    participant LogManager
    participant UnifiedLog
    participant FileSystem

    Note over AdminClient, FileSystem: Topic Creation Phase
    AdminClient->>Controller: CreateTopicsRequest
    Controller->>Controller: Assign partitions & replicas
    Controller->>Broker: LeaderAndIsrRequest (new topic partitions)
    Broker->>ReplicaManager: becomeLeaderOrFollower()
    ReplicaManager->>ReplicaManager: makeLeaders() / makeFollowers()
    ReplicaManager->>LogManager: getOrCreateLog(topicPartition)
    LogManager->>LogManager: Check if log exists
    LogManager->>UnifiedLog: new UnifiedLog(dir, config, ...)
    UnifiedLog->>FileSystem: Create log directory (/kafka-logs/topic-partition/)
    UnifiedLog->>FileSystem: Create .log, .index, .timeindex files
    UnifiedLog-->>LogManager: Log created
    LogManager-->>ReplicaManager: Log instance
    ReplicaManager-->>Broker: Partition ready
    Broker-->>Controller: LeaderAndIsrResponse
    Controller-->>AdminClient: CreateTopicsResponse

    Note over AdminClient, FileSystem: Data Production Phase
    participant Producer
    Producer->>Broker: ProduceRequest (records)
    Broker->>ReplicaManager: appendRecords()
    ReplicaManager->>ReplicaManager: getPartition() -> get leader partition
    ReplicaManager->>UnifiedLog: appendRecordsToLeader(records)
    UnifiedLog->>UnifiedLog: analyzeAndValidateRecords()
    UnifiedLog->>UnifiedLog: append() to active segment
    UnifiedLog->>FileSystem: Write records to .log file
    UnifiedLog->>FileSystem: Update .index file (offset index)
    UnifiedLog->>FileSystem: Update .timeindex file (time index)
    UnifiedLog->>UnifiedLog: maybeRoll() - check if need new segment
    alt If segment size limit reached
        UnifiedLog->>FileSystem: Create new .log segment file
        UnifiedLog->>FileSystem: Create new .index file
        UnifiedLog->>FileSystem: Create new .timeindex file
    end
    UnifiedLog-->>ReplicaManager: LogAppendInfo (offset, timestamp)
    ReplicaManager->>ReplicaManager: tryCompleteDelayedRequests()
    ReplicaManager-->>Broker: ProduceResponse
    Broker-->>Producer: ProduceResponse (offset, timestamp)
```

the general log file types and the hierarchy.

```mermaid
graph LR
    Topic["主题"] -->|分区| Partition1["Partition (分区#0)"]
    Topic -->|分区| Partition2["Partition (分区#1)"]
    Topic -->|分区| Partition3["Partition (分区#2)"]

    Partition1 -->|副本| Replica1["Replica (副本#0)"] --> Log1["Log (日志#0)"]
    Partition2 -->|副本| Replica2["Replica (副本#1)"] --> Log2["Log (日志#1)"]
    Partition3 -->|副本| Replica3["Replica (副本#2)"] --> Log3["Log (日志#2)"]

    subgraph LogSegment
        Log1 -->|LogSegment| LogSegment1["LogSegment (日志分段#0 分区#0)"]
        Log1 -->|LogSegment| LogSegment2["LogSegment (日志分段#1 分区#0)"]
        Log1 -->|LogSegment| LogSegment3["LogSegment (日志分段#2 分区#0)"]
    end

    LogSegment1 -->|Log| Log[".log 日志文件"]
    LogSegment1 -->|Index| Index[".index 偏移量索引文件"]
    LogSegment1 -->|TimeIndex| TimeIndex[".timeindex 时间戳索引文件"]
```

log retention sequence

```mermaid
sequenceDiagram
    participant Producer
    participant Broker
    participant LogSegment
    participant TimeIndex
    participant LogCleaner

    Note over Producer,LogCleaner: Message Production & Timestamp Recording
    Producer->>Broker: ProduceRequest(records with timestamps)
    Broker->>LogSegment: Append records
    LogSegment->>LogSegment: Track largest timestamp
    LogSegment->>TimeIndex: Update time index mapping

    Note over Producer,LogCleaner: Retention Check Process
    LogCleaner->>LogSegment: Check segment for retention
    LogSegment->>LogSegment: Get largest timestamp in segment
    LogSegment->>LogCleaner: Return segment.largestTimestamp
    LogCleaner->>LogCleaner: Calculate: now - largestTimestamp

    alt If age > log.retention.ms
        LogCleaner->>LogSegment: Mark for deletion
        LogSegment->>LogSegment: Delete segment files
    else Keep segment
        LogCleaner->>LogSegment: Keep segment
    end
```

## silly questions

### what's the dataflow while client produces data (in kraft mode)

1. how did client know which broker to connect
   1. through metadata request
   2. maintain in local cache
   3. refresh if any error occurred
2. how the topic partition was handled, by client or broker
   1. if the topic partition was in client side, the requests would be maintained in local memory buffer and resided inside the broker-partition section to achieve batching (and the memory pool was shared across all broker connections)

```mermaid
sequenceDiagram
    participant Producer
    participant BootstrapBroker as Bootstrap Broker
    participant Controller
    participant TargetBroker as Target Broker (Leader)

    Note over Producer,TargetBroker: Bootstrap & Metadata Discovery
    Producer->>BootstrapBroker: Connect to bootstrap.servers
    Producer->>BootstrapBroker: MetadataRequest(topics=[])
    BootstrapBroker->>Controller: Get cluster metadata
    Controller-->>BootstrapBroker: Cluster metadata
    BootstrapBroker-->>Producer: MetadataResponse(brokers, topics, partitions, leaders)

    Note over Producer,TargetBroker: Topic-Specific Metadata
    Producer->>BootstrapBroker: MetadataRequest(topics=["my-topic"])
    BootstrapBroker-->>Producer: MetadataResponse(partition leaders for "my-topic")

    Note over Producer,TargetBroker: Direct Connection to Leader
    Producer->>Producer: Determine partition (hash key or round-robin)
    Producer->>Producer: Find leader broker for target partition
    Producer->>TargetBroker: Establish connection
    Producer->>TargetBroker: ProduceRequest(records)
    TargetBroker-->>Producer: ProduceResponse(offset, timestamp)
```

## references

- https://deepwiki.com/apache/kafka
- https://kafka.apache.org/documentation/#gettingStarted
- https://github.com/apache/kafka
- [raft](https://raft.github.io/)
- 深入理解 Kafka -- 核心设计与实践原理
