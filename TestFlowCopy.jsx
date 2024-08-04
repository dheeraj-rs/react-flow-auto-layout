/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { ReactFlowProvider, useEdgesState, useNodesState } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import Layout from '../../common/layout';

import initialNodes from './data/initialNodes';
import customNodeTypes from './data/customNodeTypes';
import initialEdges from './data/initialEdges';
import ComponentSelectPopup from '../CommVoiceAdmin/components/modals/ComponentSelectPopup';
import { ListAllComponents } from '../../common/api-collection/Telephony/Components';
import useStore from '../Test/store';

import { ListCallerList } from '../../common/api-collection/Telephony/CallerList';
import { handleDeleteNode, handleRemoveConnection } from './actions';
import edgeAttributes from './data/edgeAttributes';
import Modals from './components/Modals';
import { ListVoiceCategory } from '../../common/api-collection/Telephony/VoiceCategory';
import { ListAllVoiceLibrary } from '../../common/api-collection/Telephony/VoiceLibrary';
import Audio from './components/Audio';
import { ListAgents } from '../../common/api-collection/TenantAdmin/Agents';
import { ListDepartments } from '../../common/api-collection/Department';
import { ListAllApiLibrary } from '../../common/api-collection/Telephony/ApiLibrary';
import {
  GetCallFlow,
  ListCallFlowsListWithoutPagination,
  PublishCallFlow,
  UnpublishCallFlow,
  UpdateCallFlow,
} from '../../common/api-collection/Telephony/CallFlow';
import { ListAgentAvailabilitiesWithoutPagination } from '../../common/api-collection/Telephony/AgentAvailability';
import SMSSenderID, { activeEdgeColor } from './data/data';
import SpinningLoader from '../../common/components/Loader/SpinningLoader';
import ToastSuccess from '../../common/components/toast/ToastSucess';
import ToastError from '../../common/components/toast/ToastError';
import Subhead from './Subhead';
import TestFlowModal from './TestFlowModal';
import CallFlowsReload from './components/CallFlowsReload';
import { getNodeDetails } from '../../common/helpers/utils';
import Flow from './Flow';
import { updateShortcutEdges, updateIVRMenuEdges, updatePassthruEdges } from './actions/update';
import { editLayout, getMinHeight } from './actions/flow-actions';
import { customLayout, handleUpdateLayout } from './actions/new-actions';

function TestFlow() {
  const audioRef = useRef();
  const containerRef = useRef();
  const stateRef = useRef(initialNodes);

  const params = useParams();
  let edge = {};

  const [callFlowDetails, setCallFlowDetails] = useState({ isLoading: true, data: {} });
  const [vendorComponents, setVendorComponents] = useState([]);
  const [search, setSearch] = useState('');
  const [componentsloading, setComponentsloading] = useState(false);
  const [iVRSearchResult, setIVRSearchResult] = useState([]);
  const [availableIVRMenus, setAvailableIVRMenus] = useState([]);
  const [isDataSubmiting, setIsDataSubmiting] = useState(false);
  const [active, setActive] = useState({
    state: true,
    type: '',
    categoryName: '',
    categoryId: '5',
    fileName: '',
    fileId: 1,
  });
  const [loading, setLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState({
    id: 'select',
    parentType: '',
    url: '',
    isVoicePalying: false,
  });
  const [toastAction, setToastAction] = useState({
    isVisible: false,
    type: '',
    message: '',
  });

  const [lastAction, setLastAction] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);

  const [isFlowUpdated, setIsFlowUpdated] = useState(false);

  // state's to store data -- start
  const [callerList, setCallerList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [voiceLibraryList, setVoiceLibraryList] = useState([]);
  const [allAvailableVoices, setAllAvailableVoices] = useState([]);
  const [agents, setAgents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [apiLibraries, setApiLibraries] = useState([]);
  const [callFlows, setCallFlows] = useState([]);
  const [agentAvailabilities, setAgentAvailabilities] = useState([]);
  // state's to store data -- end

  const {
    show,
    flowEdges,
    flowNodes,
    nodeSelectedForDelete,
    activeEdgeId,
    setNodeSelectedForDelete,
    setShow,
    setFlowNodes,
    setFlowEdges,
    selectedNode,
    setCallerListArray,
    setActiveEdgeId,
    setActiveNodesDetails,
    setSelectedEdge,
    setSelectedNode,
  } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // const [nodes, setNodes, onNodesChange] = useNodesState(nodesSample);
  // const [edges, setEdges] = useEdgesState(edgesSample);

  const handleUpdateCallFlow = (nodesArray = [], edgesArray = []) => {
    const flowType = { actions: nodesArray, connections: edgesArray };
    // const flowType = { actions: [], connections: [] };

    const data = {
      type: 'telephony_call-flow',
      id: params?.id,
      attributes: {
        name: callFlowDetails?.data?.attributes?.name,
        flow: flowType,
      },
    };

    // setIsDataSubmiting(true);

    UpdateCallFlow(data, params?.id)
      .then(() => {})
      .catch(() => {
        setToastAction({
          isVisible: true,
          type: 'failed',
          message: 'Something went wrong.',
        });
      })
      .finally(() => {
        // setIsDataSubmiting(false);
      });
  };

  const handleRightClick = (event) => {
    event.preventDefault(); // Prevent default right-click behavior (context menu)
    setActiveNodesDetails({ sourceId: '', targetId: '' });
    setSelectedEdge({});
    setActiveEdgeId('');
    setSelectedNode({});

    const updatedArray = edges.map((e) => ({
      ...e,
      style: edgeAttributes,
    }));

    setEdges(updatedArray);
  };

  const validate = () => {
    const errors = {};

    return errors;
  };

  const formik = useFormik({
    initialValues: {
      isEditing: false,
      callFlowName: '',
    },
    validate,
    onSubmit: () => {},
  });

  const handleIVRSearch = (key) => {
    const matchingNames = availableIVRMenus?.filter((ivr) => {
      const name = ivr?.name;
      if (name?.toLowerCase().includes(key.toLowerCase())) {
        return name;
      }
      return '';
    });
    setIVRSearchResult(matchingNames);
  };

  const handleSelectIVR = (targetNodeId) => {
    const id = uuidv4();

    edge = {
      id: `edge-${id}`,
      source: show?.prevNodeId,
      sourceHandle: `${show?.targetType}:source:${show?.prevNodeId}`,
      target: targetNodeId,
      targetHandle: `ivr-menu-2:target:${targetNodeId}`,
      targetType: 'ivr-menu-2',
      type: edgeAttributes.type,
      style: edgeAttributes,
    };

    setEdges((prevArray) => {
      const updatedArray = [...prevArray, edge];
      setFlowEdges(updatedArray);
      return updatedArray;
    });

    setShow({ isVisible: false, type: '' });
  };

  const handleListVendorComponents = () => {
    setComponentsloading(true);
    ListAllComponents(search)
      ?.then((response) => {
        setVendorComponents(response?.data);
      })
      .finally(() => {
        setComponentsloading(false);
      });
  };

  const createEdge = (nodesArray, data) => {
    const id = uuidv4();

    if (show?.prevNodeId === 'incoming-call') {
      edge = {
        id: `edge-${id}`,
        source: show?.prevNodeId,
        sourceHandle: 'incomingCall',
        target: nodesArray[nodesArray.length - 1]?.id,
        targetHandle: `${data?.type}:target:${nodesArray[nodesArray.length - 1]?.id}`,
        targetType: data?.type,
        type: edgeAttributes.type,
        style: edgeAttributes,
        keyValue: show?.keyValue,
        sourceIndex: selectedNode.sourceIndex,
      };

      // Only incoming & Lets-start node is present
      setEdges(() => {
        setFlowEdges([edge]);
        handleUpdateCallFlow(nodesArray, [edge]);
        return [edge];
      });
    } else if (edges.length > 0 && edges[edges.length - 1]?.id === 'incoming-call') {
      edge = {
        id: `edge-${id}`,
        source: show?.prevNodeId,
        sourceHandle: 'incomingCall',
        target: nodesArray[nodesArray.length - 1]?.id,
        targetHandle: `${data?.type}:target:${nodesArray[nodesArray.length - 1]?.id}`,
        targetType: data?.type,
        type: edgeAttributes.type,
        style: edgeAttributes,
        keyValue: show?.keyValue,
        sourceIndex: selectedNode.sourceIndex,
      };

      // Only incoming & Lets-start node is present
      setEdges(() => {
        setFlowEdges([edge]);
        handleUpdateCallFlow(nodesArray, [edge]);
        return [edge];
      });
    } else if (edges.length > 0) {
      edge = {
        id: `edge-${id}`,
        source: show?.prevNodeId,
        sourceHandle: `${show?.targetType}:source:${show?.prevNodeId}`,
        target: nodesArray[nodesArray.length - 1]?.id,
        targetHandle: `${data?.type}:target:${nodesArray[nodesArray.length - 1]?.id}`,
        targetType: data?.type,
        type: edgeAttributes.type,
        style: edgeAttributes,
        keyValue: show?.keyValue,
        sourceIndex: selectedNode.sourceIndex,
      };

      setEdges((prevArray) => {
        const updatedArray = [...prevArray, edge];
        setFlowEdges(updatedArray);
        handleUpdateCallFlow(nodesArray, updatedArray);
        return updatedArray;
      });
    }

    setShow({ isVisible: false, type: '' });
  };

  const updateEdgesArray = async (nodeDetails, updatedDetails) => {
    updateShortcutEdges(setEdges, setFlowEdges, nodeDetails, updatedDetails, edges);
    updateIVRMenuEdges(setEdges, nodeDetails, updatedDetails, edges);
    updatePassthruEdges(setEdges, nodeDetails, edges);

    setShow({ isVisible: false, type: '' });

    setRefreshKey((prevKey) => prevKey + 1);
  };

  const resetFlowLayout = () => {
    const newNodes = customLayout(nodes, edges);
    setNodes(newNodes);
  };

  const handleAddComponent = (data) => {
    const id = uuidv4();
    //
    const newNode = {
      id,
      prevNodeId: data.prevNodeId,
      prevHandleId: data.prevHandleId,
      position: { x: 0, y: 0 },
      parentId: selectedNode.nodeId || '',
      childrens: [],
      sourceIndex: selectedNode.sourceIndex,
      minHeight: getMinHeight(data.type, data),
      type: data.type,
      data: {
        label: data.label,
      },
      defaultPosition: { x: 0, y: 0 },
      details: data.details,
      x: 500,
      y: 117.5,
      rank: 2,
      draggable: true,
      name: data.name,
      column: 0,
      hidden: false,
    };

    if (data.prevNodeId === 'incomingCall') {
      handleDeleteNode('node-2', setNodes).then((response) => {
        // updateLayout(
        //   response,
        //   newNode,
        //   setNodes,
        //   setFlowNodes,
        //   stateRef,
        //   selectedNode,
        //   createEdge,
        //   data
        // );
        const nodesArray = handleUpdateLayout(response, newNode, setNodes, setFlowNodes, stateRef);
        createEdge(nodesArray, data);
      });
    } else {
      // updateLayout(
      //   nodes,
      //   newNode,
      //   setNodes,
      //   setFlowNodes,
      //   stateRef,
      //   selectedNode,
      //   createEdge,
      //   data
      // );
      const nodesArray = handleUpdateLayout(nodes, newNode, setNodes, setFlowNodes, stateRef);
      createEdge(nodesArray, data);
    }
    setLastAction('add-node');

    //
    setShow({
      isVisible: false,
      type: data?.type,
      prevNodeId: data?.prevNodeId,
      prevHandleId: data?.prevHandleId,
      targetType: show?.targetType,
      id,
    });
    data?.formik.resetForm();
    setIsFlowUpdated(true);
  };

  const handleUpdateNode = (data) => {
    const nodeDetails = getNodeDetails(data?.nodeId, flowNodes);

    const updatedNode = nodes.filter((node) => node.id === data?.nodeId)[0];
    editLayout(nodes, updatedNode, setNodes, data, setFlowNodes);

    updateEdgesArray(nodeDetails, data.details).then(() => {
      handleUpdateCallFlow(flowNodes, flowEdges);
    });
  };

  const onNodesDragEnd = (e) => {
    setFlowNodes(nodes);
    handleUpdateCallFlow(nodes, edges);
  };

  const togglePlay = (id, parentType, url, isVoicePalying) => {
    audioRef.current.src = url;
    audioRef.current.src = url;
    setSelectedVoice({
      id,
      parentType,
      url,
      isVoicePalying,
    });

    audioRef?.current?.play();
  };

  const onPause = (id, parentType, url, isVoicePalying) => {
    audioRef.current.currentTime = 0;
    audioRef.current.pause();
    setSelectedVoice({
      id,
      parentType,
      url,
      isVoicePalying,
    });
  };

  const resetAudio = () => {
    setSelectedVoice({
      id: 'select',
      parentType: '',
      url: '',
      isVoicePalying: false,
    });
    audioRef.current.currentTime = 0;
    audioRef.current.pause();
  };

  const handleRemoveConnections = () => {
    const selectedNodeId = nodeSelectedForDelete.nodeId;

    const edgeAsSource = edges.filter((e) => e.source === selectedNodeId);
    const edgeAsTarget = edges.filter((e) => e.target === selectedNodeId)[0];

    handleRemoveConnection(edgeAsTarget?.id, edges).then((result) => {
      const updatedArray = result.filter((e) => !edgeAsSource.includes(e));
      setEdges(updatedArray);
      setFlowEdges(updatedArray);
    });

    setNodeSelectedForDelete({ isVisible: false, nodeId: '', type: '' });
  };

  const handleDeleteComponent = () => {
    const selectedNodeId = nodeSelectedForDelete.nodeId;

    const edgeAsSource = edges.filter((e) => e.source === selectedNodeId);
    const edgeAsTarget = edges.filter((e) => e.target === selectedNodeId)[0];

    handleDeleteNode(selectedNodeId, setNodes).then((updatedNodesArray) => {
      handleRemoveConnection(edgeAsTarget?.id, edges).then((result) => {
        const updatedEdgesArray = result.filter((e) => !edgeAsSource.includes(e));
        setEdges(updatedEdgesArray);
        setFlowEdges(updatedEdgesArray);
        handleUpdateCallFlow(updatedNodesArray, updatedEdgesArray);
      });
    });
    setNodeSelectedForDelete({ isVisible: false, nodeId: '', type: '' });
  };

  const onConnect = (e) => {
    const id = uuidv4();

    if (e.source === 'incomingCall') {
      edge = {
        id: `edge-${id}`,
        source: 'incomingCall',
        sourceHandle: 'incomingCall',
        target: e?.target,
        targetHandle: e?.targetHandle,
        targetType: e?.targetHandle?.split(':')[0],
        type: edgeAttributes.type,
        style: edgeAttributes,
      };
    } else {
      edge = {
        id: `edge-${id}`,
        source: e?.source,
        sourceHandle: e?.sourceHandle,
        target: e?.target,
        targetHandle: e?.targetHandle,
        targetType: e?.targetHandle?.split(':')[0],
        type: edgeAttributes.type,
        style: edgeAttributes,
      };
    }

    setEdges((prevArray) => {
      const updatedArray = [...prevArray, edge];
      setFlowEdges(updatedArray);
      handleUpdateCallFlow(nodes, updatedArray);
      return updatedArray;
    });
  };

  const onEdgeClick = (event, e) => {
    setActiveEdgeId(e.id);
    const result = edges.filter((p) => p.id === e.id);
    if (result.length > 0) {
      setActiveNodesDetails({ sourceId: result[0]?.source, targetId: result[0]?.target });
    } else {
      setActiveNodesDetails({ sourceId: '', targetId: '' });
    }
  };

  const handlePublishCallFlow = () => {
    PublishCallFlow(params?.id)
      ?.then(() => {
        setToastAction({
          isVisible: true,
          type: 'success',
          message: 'Flow has been published successfully.',
        });
      })
      .catch((error) => {
        if (error?.response?.status === 500) {
          setToastAction({
            isVisible: true,
            type: 'failed',
            message: 'Something went wrong.',
          });
        } else {
          setToastAction({
            isVisible: true,
            type: 'failed',
            message: error?.response?.data?.error?.message,
          });
        }
      })
      .finally(() => {
        setShow({
          isVisible: false,
          type: '',
        });
      });
  };

  const handleUnPublishCallFlow = () => {
    UnpublishCallFlow(params?.id)
      ?.then(() => {
        setToastAction({
          isVisible: true,
          type: 'success',
          message: 'Flow has been Unpublished successfully.',
        });
      })
      .catch((error) => {
        if (error?.response?.status === 500) {
          setToastAction({
            isVisible: true,
            type: 'failed',
            message: 'Something went wrong.',
          });
        } else {
          setToastAction({
            isVisible: true,
            type: 'failed',
            message: error?.response?.data?.error?.message,
          });
        }
      })
      .finally(() => {
        setShow({
          isVisible: false,
          type: '',
        });
      });
  };

  // const setToDefaultLayout = () => {
  //   setNodes((prevNodes) => {
  //     const result = prevNodes.map((node) => ({ ...node, position: node.defaultPosition }));
  //     return result;
  //   });
  // };

  const handleAudioError = () => {
    if (audioRef.current.src) {
      setSelectedVoice({
        id: 'select',
        parentType: '',
        url: '',
        isVoicePalying: false,
      });
      setToastAction({
        isVisible: true,
        type: 'failed',
        message: 'Error while loading audio',
      });
    }
  };

  useEffect(() => {
    handleListVendorComponents();
  }, [search]);

  useEffect(() => {
    ListAgents('telephony')?.then((response) => {
      setAgents(response?.data);
    });

    ListDepartments()?.then((response) => {
      setDepartments(response?.data);
    });

    ListAllApiLibrary()?.then((response) => {
      setApiLibraries(response?.data);
    });

    ListCallFlowsListWithoutPagination()?.then((response) => {
      setCallFlows(response?.data);
    });

    ListCallerList()?.then((response) => {
      setCallerList(response?.data);
      setCallerListArray(response?.data);
    });

    ListVoiceCategory()?.then((response) => {
      setCategoriesList(response?.data);
    });

    ListAllVoiceLibrary()?.then((response) => {
      setAllAvailableVoices(response?.data);
    });

    ListAgentAvailabilitiesWithoutPagination()?.then((response) => {
      setAgentAvailabilities(response?.data);
    });
  }, []);

  useEffect(() => {
    const temp = [];

    if (nodes?.length > 0) {
      nodes?.map((node) => {
        if (node?.type === 'ivr-menu') {
          temp.push(node);
        }
        return temp;
      });

      if (temp?.length > 0) {
        setAvailableIVRMenus(temp);
        setIVRSearchResult(temp);
      } else {
        setIVRSearchResult([]);
      }
    }
  }, [nodes]);

  useEffect(() => {
    if (edges?.length === 0 && nodes?.length === 1 && nodes[0]?.id === 'incomingCall') {
      setNodes(initialNodes);
      setEdges(initialEdges);
      handleUpdateCallFlow(initialNodes, initialEdges);
    }
  }, [edges]);

  useEffect(() => {
    if (active?.categoryId) {
      setLoading(true);

      ListAllVoiceLibrary(active?.fileName, active?.categoryId)
        ?.then((response) => {
          setVoiceLibraryList(response?.data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [active?.categoryId, active?.fileName]);

  useEffect(() => {
    if (activeEdgeId) {
      const updatedArray = edges.map((e) => {
        if (e.id === activeEdgeId) {
          return { ...e, style: { stroke: activeEdgeColor, strokeWidth: 2 } };
        }
        return { ...e, style: edgeAttributes };
      });
      setEdges(updatedArray);
    }
  }, [activeEdgeId]);

  useEffect(() => {
    setCallFlowDetails({ isLoading: true, data: {} });
    GetCallFlow(params?.id)
      ?.then((response) => {
        setCallFlowDetails({ isLoading: false, data: response?.data });
      })
      .catch(() => {
        setCallFlowDetails({ isLoading: false, data: {} });
      });
  }, []);

  useEffect(() => {
    const flow = callFlowDetails?.data?.attributes?.flow;
    if (flow?.actions?.length > 0 && flow?.connections?.length > 0) {
      setEdges(flow?.connections);
      setNodes(flow?.actions);

      setFlowEdges(flow?.connections);
      setFlowNodes(flow?.actions);
    }
  }, [callFlowDetails]);

  useEffect(() => {
    const newNodes = customLayout(stateRef.current, edges);
    setNodes(newNodes);
  }, [stateRef.current]);

  // useEffect(() => {
  //   resetFlowLayout();
  // }, [nodes.length]);

  return (
    <Layout
      title="comm voice"
      headerTitle="Call Flows"
      favIcon="/assets/favIcons/favicon-voice.ico"
      active="/app/comm-voice-admin/call-flow"
      sideNavIcon="/assets/comm-voice-logo.svg"
    >
      <Audio
        audioRef={audioRef}
        selectedVoice={selectedVoice}
        handleAudioError={handleAudioError}
      />

      <div className="wrapper d-flex flex-column flex-lg-row gap-0 gap-lg-3 p-16px p-md-18px mt-66px ms-md-0 ms-lg-65px h-fit flows-pad-mob">
        <div id="flow-builder-main" className="col-lg-12">
          <div className="row h-100">
            <div className="col-12">
              <div className="row">
                <div className="call-header-outer">
                  <Subhead
                    id={callFlowDetails?.data?.id}
                    name={callFlowDetails?.data?.attributes?.name}
                    isPublished={callFlowDetails?.data?.attributes?.is_published}
                    status={callFlowDetails?.data?.attributes?.status}
                    formik={formik}
                    loading={false}
                  />
                </div>

                <div className="main-body-outer p-3">
                  <div
                    ref={containerRef}
                    onContextMenu={handleRightClick}
                    className={`main-body-inner scroll-custom shadow-3 ${
                      callFlowDetails.isLoading ? 'd-none' : ''
                    }`}
                    style={{
                      paddingTop: '0',
                      paddingBottom: '0',
                      paddingLeft: '0',
                      paddingRight: '0',
                    }}
                  >
                    <CallFlowsReload setToDefaultLayout={resetFlowLayout} />

                    <ReactFlowProvider>
                      <Flow
                        refreshKey={refreshKey}
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={customNodeTypes}
                        onNodesChange={onNodesChange}
                        onNodeDragStop={onNodesDragEnd}
                        onConnect={onConnect}
                        onEdgeClick={onEdgeClick}
                        snapToGrid
                        snapGrid={[15, 15]}
                        isFlowUpdated={isFlowUpdated}
                        setIsFlowUpdated={setIsFlowUpdated}
                      />
                    </ReactFlowProvider>
                  </div>
                  <div
                    className="main-body-inner scroll-custom shadow-3 d-flex align-items-center justify-content-center"
                    style={callFlowDetails.isLoading ? {} : { display: 'none' }}
                  >
                    <SpinningLoader />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ComponentSelectPopup
        isVisible={show?.isVisible && show?.type === 'select-components'}
        vendorComponents={vendorComponents}
        setSearch={setSearch}
        search={search}
        componentsloading={componentsloading}
        iVRSearchResult={iVRSearchResult}
        handleIVRSearch={handleIVRSearch}
        handleSelectIVR={handleSelectIVR}
      />

      <Modals
        show={show}
        setShow={setShow}
        categoriesList={categoriesList}
        voiceLibraryList={voiceLibraryList}
        setVoiceLibraryList={setVoiceLibraryList}
        active={active}
        setActive={setActive}
        loading={loading}
        togglePlay={togglePlay}
        selectedVoice={selectedVoice}
        onPause={onPause}
        resetAudio={resetAudio}
        allAvailableVoices={allAvailableVoices}
        isDataSubmiting={isDataSubmiting}
        onSelect={(data) => {
          handleAddComponent(data);
        }}
        onUpdate={(data) => {
          handleUpdateNode(data);
        }}
        callerList={callerList}
        setLoading={setLoading}
        departments={departments}
        agents={agents}
        apiLibraries={apiLibraries}
        agentAvailabilities={agentAvailabilities}
        SMSSenderID={SMSSenderID}
        callFlows={callFlows}
        nodeSelectedForDelete={nodeSelectedForDelete}
        setNodeSelectedForDelete={setNodeSelectedForDelete}
        handleDeleteComponent={() => {
          handleDeleteComponent();
        }}
        handleRemoveConnections={() => {
          handleRemoveConnections();
        }}
        handlePublishCallFlow={handlePublishCallFlow}
        handleUnPublishCallFlow={handleUnPublishCallFlow}
        setCategoriesList={setCategoriesList}
      />

      <TestFlowModal
        isVisible={show?.isVisible && show?.type === 'test-flow'}
        nodes={nodes}
        edges={edges}
        callFlowName={callFlowDetails?.data?.attributes?.name}
        callFlowId={callFlowDetails?.data?.id}
        isPublished={callFlowDetails?.data?.attributes?.is_published}
        allAvailableVoices={allAvailableVoices}
        onClose={() => {
          setShow({ isVisible: false, type: '' });
        }}
      />

      {toastAction.type === 'success' ? (
        <ToastSuccess
          id="RenameWidgetMsg"
          onClose={() => {
            setToastAction({ isVisible: false, message: '' });
          }}
          showToast={toastAction?.isVisible}
        >
          <span>{toastAction?.message}</span>
        </ToastSuccess>
      ) : (
        <ToastError
          id="RenameWidgetMsg"
          onClose={() => {
            setToastAction({ isVisible: false, message: '' });
          }}
          showToast={toastAction?.isVisible}
          isSuccess={false}
        >
          <span>{toastAction?.message}</span>
        </ToastError>
      )}
    </Layout>
  );
}

export default TestFlow;
